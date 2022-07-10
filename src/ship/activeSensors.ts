import EMSReading from './EMSReading.js'
import APIResponse from '../helpers/response.js'
import Vector2 from '../helpers/Vector2.js'
import ColonyShip from './colonyShip.js'
import RenderedObject from '../renderedObject.js'
import Game from '../game.js'
import Planet from '../spaceObjects/planet.js'
import Torpedo from './torpedo.js'

export default class ActiveSensors extends RenderedObject {
	#parentShip: ColonyShip //Reference to the ColonyShip
	ctx = 'ships'
	cooldown = 0
	radius = 5
	arcStartAngle = 0
	arcEndAngle = Math.PI * 0.5
	constructor(parentShip: ColonyShip, game: Game) {
		super(parentShip.pos, game)
		this.#parentShip = parentShip
		this.pos = this.#parentShip.pos
	}
	#pointInScanSlice(point: Vector2) {
		let dist = this.#parentShip.pos.distance(point)
		if (dist > this.radius) return false
		let angle = point.subtract(this.#parentShip.pos).angle()
		if (this.arcStartAngle > 0 && this.arcEndAngle < 0) {
			if ((angle > this.arcEndAngle && angle < this.arcStartAngle) || (angle < this.arcStartAngle && angle > this.arcEndAngle)) return false
		} else {
			if (angle < this.arcStartAngle || angle > this.arcEndAngle) return false
		}
		return true
	}
	scan(heading: number, arc: number, range: number) {
		// Ensure solar system is initialized before performing scan
		if (!this.#parentShip.solarSystem) return new APIResponse(400, ['Cannot perform ActiveSensors scan until solar system initialized'], [])
		if (arc > Math.PI) return new APIResponse(400, ['arc is too large. Max: Pi'], [])
		if (arc < 0) return new APIResponse(400, ['arc must be larger than 0'], [])
		if (heading > Math.PI || heading < -Math.PI) return new APIResponse(400, [`heading of ${heading} must be between Pi and -Pi `], [])
		if (this.cooldown) return new APIResponse(400, ['ActiveSensors is still on cooldown'], [])
		this.cooldown = 50
		this.arcStartAngle = heading
		this.arcEndAngle = this.arcStartAngle + arc
		if (this.arcEndAngle > Math.PI) this.arcEndAngle = -2 * Math.PI + this.arcEndAngle
		if (this.arcEndAngle < -Math.PI) this.arcEndAngle = 2 * Math.PI - this.arcEndAngle
		this.radius = range

		//Calculate which objects exist in pizza slice
		// First check if it is within the range
		// Check that angle between start ponit and target point are between the start angle and end angle

		// Note: angle must account for relative position of object to ship (not global position on board)
		// To find angle, find angle difference between the vector from ship to object & current ship heading
		// y coordinate is inverted due to the flipped board axis (greater y value indicates lower position)
		let readings: EMSReading[] = []
		for (const spaceObject of [...this.#parentShip.process.delObjects, ...this.#parentShip.process.staticObjects]) {
			if (this.#pointInScanSlice(spaceObject.pos)) {
				if (spaceObject instanceof Torpedo) break
				let angle = spaceObject.pos.subtract(this.#parentShip.pos).angle()
				// let angle = this.#parentShip.pos.angleTo(spaceObject.pos)
				let distance = this.#parentShip.pos.distance(spaceObject.pos)
				let amplitude = spaceObject.mass / distance
				let scanSignature = spaceObject instanceof Planet ? spaceObject.composition : undefined
				readings.push(new EMSReading(angle, amplitude, Vector2.zero, spaceObject.radius, scanSignature))
			}
		}
		return new APIResponse(200, [], readings, true)
	}
	draw() {
		if (!this.cooldown) return
		// Set the context's translation.
		let ctx: CanvasRenderingContext2D = this.game.contexts[this.ctx]
		ctx.setTransform(1, 0, 0, 1, ((this.pos.x / 10) * this.game.unit - this.game.camera.x) * this.game.zoom, ((this.pos.y / 10) * this.game.unit - this.game.camera.y) * this.game.zoom)
		// Draw the image with a half-size offset, so that rotating works properly and the coordinate represent the center.
		// ctx.drawImage(
		// 	this.image,
		// 	((-(this.size.x / 10) * this.game.unit) / 2) * this.game.zoom,
		// 	((-(this.size.y / 10) * this.game.unit) / 2) * this.game.zoom,
		// 	(this.size.x / 10) * this.game.unit * this.game.zoom,
		// 	(this.size.y / 10) * this.game.unit * this.game.zoom
		// )
		ctx.fillStyle = `rgba(255, 0, 0, ${this.cooldown / 100})`
		ctx.lineWidth = 2

		if (Math.abs(Math.abs(this.arcStartAngle) - Math.abs(this.arcEndAngle)) > Math.PI) {
			console.log('too big')
		} else {
			ctx.beginPath()
			ctx.arc(0, 0, (this.radius * this.game.unit * this.game.zoom) / 10, this.arcStartAngle, this.arcEndAngle)
			ctx.closePath()
			ctx.fill()

			ctx.beginPath()
			ctx.moveTo(0, 0)
			let startPoint = new Vector2(this.radius, 0).rotateTo(this.arcStartAngle).scale((this.game.unit * this.game.zoom) / 10)
			let endPoint = new Vector2(this.radius, 0).rotateTo(this.arcEndAngle).scale((this.game.unit * this.game.zoom) / 10)
			ctx.lineTo(startPoint.x, startPoint.y)
			ctx.lineTo(endPoint.x, endPoint.y)
			ctx.closePath()
			ctx.fill()
		}
	}
	update() {
		if (this.cooldown > 0) this.cooldown -= 1
		else this.cooldown = 0
		this.pos = this.#parentShip.pos
	}
}
