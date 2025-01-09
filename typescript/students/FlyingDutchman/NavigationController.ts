import { Vector2 } from '../helpers.js'
import { MapData, ShipStatus} from '../types.js'

import NavigationController from '../../src/subsystems/navigationController.js'
import YourDefenceController from './DefenseController.js'
import YourPropulsionController from './PropulsionController.js'
import YourSensorsController from './SensorsController.js'

export default class YourNavigationController extends NavigationController {
	// To get other subsystem information, use the attributes below.
	// @ts-ignore
	defence: YourDefenceController // @ts-ignore
	sensors: YourSensorsController // @ts-ignore
	propulsion: YourPropulsionController

	//Add additional attributes here
	radius:number = 25 // Ship radius is a constant
	xPos:number = 0
	yPos:number = 0
	angle:number = 0
	xVelocity:number = 0
	yVelocity:number = 0
	angVelocity:number = 0
	mainThrust:number = 0
	bowThrust:number = 0
	CWThrust:number = 0
	CCWThrust:number = 0
	updateMapDataFlag:boolean = true
	warpGates:string[]
	planets:string[]
	solarSystem:number = 0

	navigationUpdate(getShipStatus: (key: keyof ShipStatus) => number, warp: () => Error|null, land: () => Error|null, getMapData: () => MapData) {
		// Update all statuses of the ship for use in the D.P.S controllers
		this.xPos = getShipStatus('positionX')
		this.yPos = getShipStatus('positionY')
		this.angle = getShipStatus('angle')
		this.xVelocity = getShipStatus('linearVelocityX')
		this.yVelocity = getShipStatus('linearVelocityY')
		this.angVelocity = getShipStatus('angularVelocity')
		this.mainThrust = getShipStatus('thrusterPowerMain')
		this.bowThrust = getShipStatus('thrusterPowerBow')
		// Check if we want to warp
		if(this.sensors.warp){
			this.solarSystem++;
			warp()
		}
		// Check if we want to land
		if(this.sensors.land){
			land()
		}
		// Update map data if we have warped to a new solar system since the last function call
		if(this.updateMapDataFlag){
			this.warpGates = getMapData().galaxy.solarSystems[this.solarSystem].warpGates
			this.planets = getMapData().galaxy.solarSystems[this.solarSystem].planets
		}
		// **USE VECTOR2 OBJECT TO STORE**
		// const direction = new Vector2(0,0)
		
	}
}
