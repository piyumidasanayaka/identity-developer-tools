import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
const axios = require('axios');
import { FileHandler } from './fileHandler';
import { Wso2OAuth } from './oAuthService';
const keytar = require('keytar');
// Object of the FileHandler.
const fileHandler = new FileHandler();

export class ServiceManger {

	constructor(context) {
		var context = context;
	}
	/**
	 * getServicesList() to get the services using the apis.
	 */
	public async getServicesList() {
		var url = vscode.workspace.getConfiguration().get('IAM.URL');
		var acessToken;
		// Get the acess token from the system key chain.
		var secret = keytar.getPassword("acessToken", "acessToken");
		await secret.then((result) => {
			acessToken = result; // Assign the value to acess toke.					
		});

		// To bypass the self signed server error.
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

		axios({

			method: 'get',
			url: url + `/t/carbon.super/api/server/v1/applications`,

			// Set the content type header, so that we get the response in JSOn
			headers: {
				Authorization: 'Bearer ' + acessToken,
				accept: '*/*'

			}
		}).then(async (response) => {
			// Once we get the response, extract the access token from
			// the response body
			console.log(response.data.applications);
			// Show the sucess message in the vscode.
			vscode.window.showInformationMessage("Successfully retrieve the services");
			this.createListOfServices(response.data.applications);
			
		}).catch((err) => {
			// Do somthing
			console.log(err);

			// Show the sucess message in the vscode.
			vscode.window.showErrorMessage("Acess Token has expired.");

		});
	}

	/**
	 * createListOfServices() to create a list in command pallete.
	 */
	public async createListOfServices(servicesArray) {		
		var services = [];
		try {
			for (let index = 0; index < servicesArray.length; index++) {
				services.push(servicesArray[index].name);	
				console.log(servicesArray[index].name);		
			}			
		} catch (error) {
			console.log(error);
		}
		
		// Show the list of services in command pallet.
		var result = await vscode.window.showQuickPick(
			services,
			{ placeHolder: 'Select Service' }
		);
		if(result != undefined){
			this.getIDOfService(servicesArray,result);
		}else{
			vscode.window.showInformationMessage("You do not select any service");
		}
		
	}	

	/**
	 * getIDOfService() to get the id of the selected service.
	 */
	public getIDOfService(servicesArray,service) {
		var serviceID;
		for (let index = 0; index < servicesArray.length; index++) {
			if(service==servicesArray[index].name){
				serviceID = servicesArray[index].id;
			}
		}
		this.exportService(serviceID , service);	
	}	

	/**
	 * exportService() to export the xml of the service.
	 */
	public async exportService(serviceID , service) {		
		var url = vscode.workspace.getConfiguration().get('IAM.URL');
		var acessToken;
		// Get the acess token from the system key chain.
		var secret = keytar.getPassword("acessToken", "acessToken");
		await secret.then((result) => {
			acessToken = result; // Assign the value to acess toke.					
		});

		// To bypass the self signed server error.
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

		axios({

			method: 'get',
			url: url + `/t/carbon.super/api/server/v1/applications/${serviceID}/export`,

			// Set the content type header, so that we get the response in JSOn
			headers: {
				Authorization: 'Bearer ' + acessToken,
				accept: '*/*'

			},
			query: {
				exportSecrets: false
			}
		}).then(async (response) => {
			// Once we get the response, extract the access token from
			// the response body
			console.log(response.data);
			// Pass data to the method of the file handler.
			fileHandler.createXMLFile(response.data,service);
			// Show the sucess message in the vscode.
			vscode.window.showInformationMessage("Successfully retrieve the services");

		}).catch((err) => {
			// Do somthing
			console.log(err);

			// Show the sucess message in the vscode.
			vscode.window.showErrorMessage("Error..");

		});
	}	
}