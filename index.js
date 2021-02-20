const core 		= 	require('@actions/core');
const github 	= 	require('@actions/github');

const fetch 	= 	require('node-fetch');
const dotenv 	= 	require('dotenv');

const tfeDomain = 	"https://app.terraform.io";

let getWorkSpaces = async (tfeToken, organizationName) => {	
	return await fetch(tfeDomain + '/api/v2/organizations/'+ organizationName +'/workspaces', {
		method: 'GET',
		json: true,
		headers: {
			"Content-Type": "application/vnd.api+json",
			"Authorization": "Bearer " + tfeToken
		}
	})
	.then(res => res.json())
	.then(res => {
		if(res.data) {
			return {
				status: 200,
				message: "Request Successful",
				data: res
			};
		}else {
			return {
				status: 400,
				message: (res.errors && res.errors.length >= 0 ? res.errors[0].status + " - " + res.errors[0].title + " (" + res.errors[0].detail + ")" : "Failed to get WorkSpaces.")
			};	
		}
	}).finally(err => {
		return {
			status: 400,
			message: "Invalid Request. Please try again."
		};
	});
}

let getWorkSpace = async (tfeToken, organizationName, workSpaceName) => {
	let workSpace = null;

	let workSpaces = await getWorkSpaces(tfeToken, organizationName);
	if(workSpaces.status === 200) {
		workSpaces = workSpaces.data;	

		if(workSpaces.data && workSpaces.data.length > 0) {
			for(let i = 0; i < workSpaces.data.length; i++) {
				if(workSpaces.data[i].attributes && workSpaces.data[i].attributes.name && workSpaces.data[i].attributes.name == workSpaceName) {
					workSpace = workSpaces.data[i];
				}
			}
		}
	}else {
		core.setFailed(workSpaces.message);
	}

	return workSpace;
}

let getVariables = async (tfeToken, organizationName, workSpaceName) => {
	return await fetch(tfeDomain + '/api/v2/vars?filter[organization][name]='+ organizationName +'&filter[workspace][name]='+ workSpaceName, {
		method: 'GET',
		json: true,
		headers: {
			"Content-Type": "application/vnd.api+json",
			"Authorization": "Bearer " + tfeToken
		}
	})
	.then(res => res.json())
	.then(res => {
		if(res.data) {
			return {
				status: 200,
				message: "Request Successful",
				data: res
			};
		}else {
			return {
				status: 400,
				message: (res.errors && res.errors.length >= 0 ? res.errors[0].status + " - " + res.errors[0].title + " (" + res.errors[0].detail + ")" : "Failed to get Variables.")
			};	
		}
	}).finally(err => {
		return {
			status: 400,
			message: "Invalid Request. Please try again."
		};
	});
}

let getVariable = async (tfeToken, organizationName, workSpaceName, variableName) => {
	let variables = await getVariables(tfeToken, organizationName, workSpaceName);
	let variable = null;
	
	if(variables.status === 200) {
		variables = variables.data;		

		if(variables.data && variables.data.length > 0) {
			for(let i = 0; i < variables.data.length; i++) {
				if(variables.data[i].attributes && variables.data[i].attributes.key && variables.data[i].attributes.key == variableName) {
					variable = variables.data[i];
				}
			}
		}
	}else {
		core.setFailed(variables.message);
	}

	return variable;
}

let getAndSetVariable = async (tfeToken, organizationName, workSpaceId, workSpaceName, variables) => {
	return new Promise((resolve, reject) => {
		Object.keys(variables).forEach(async key => {
			console.log(`Step - Getting ${ key } variable`);
			await getVariable(tfeToken, organizationName, workSpaceName, key)
			.then(async (variable) => {
				if(variable && variable !== null) {
					console.log(`Step - Updating ${ key } variable`);
					await updateVariable(tfeToken, variable, variables[key]).then((result) => {
						if(result.status !== 200)
							core.setFailed(`Error updating ${ key } variable!`);
					});
				}else {
					console.log(`Step - Adding ${ key } variable`);
					await addVariable(tfeToken, workSpaceId, key, variables[key]).then((result) => {
						if(result.status !== 200)
							core.setFailed(`Error adding ${ key } variable!`);
					});
				}
			});

			if(Object.keys(variables).indexOf(key) == (Object.keys(variables).length - 1)) {
				resolve("Completed");
			}
		});
	});	
}

let addVariable = async (tfeToken, workSpaceId, variableName, variableValue) => {
	return await fetch(tfeDomain + '/api/v2/vars', {
		method: 'POST',
		json: true,
		body: JSON.stringify({
			"data": {
				"type": "vars",
				"attributes": {
					"key": variableName,
					"value": variableValue,
					"description": "",
					"category": "terraform",
					"hcl": false,
					"sensitive": false
				},
				"relationships": {
					"workspace": {
						"data": {
							"id": workSpaceId,
							"type": "workspaces"
						}
					}
				}
			}
		}),
		headers: {
			"Content-Type": "application/vnd.api+json",
			"Authorization": "Bearer " + tfeToken
		}
	})
	.then(res => res.json())
	.then(res => {
		if(res.data) {
			return {
				status: 200,
				message: "Request Successful",
				data: res
			};
		}else {
			return {
				status: 400,
				message: (res.errors && res.errors.length >= 0 ? res.errors[0].status + " - " + res.errors[0].title + " (" + res.errors[0].detail + ")" : "Failed to add Variable.")
			};	
		}
	}).finally(err => {
		return {
			status: 400,
			message: "Invalid Request. Please try again."
		};
	});
}

let updateVariable = async (tfeToken, variableData, newVariableValue) => {
	return await fetch(tfeDomain + '/api/v2/vars/' + variableData.id, {
		method: 'PATCH',
		json: true,
		body: JSON.stringify({
			"data": {
				"type": "vars",
				"id": variableData.id,
				"attributes": {
					"key": variableData.attributes.key,
					"value": newVariableValue,
					"description": variableData.attributes.description,
					"category": variableData.attributes.category,
					"hcl": variableData.attributes.hcl,
					"sensitive": variableData.attributes.sensitive
				}
			}
		}),
		headers: {
			"Content-Type": "application/vnd.api+json",
			"Authorization": "Bearer " + tfeToken
		}
	})
	.then(res => res.json())
	.then(res => {
		if(res.data) {
			return {
				status: 200,
				message: "Request Successful",
				data: res
			};
		}else {
			return {
				status: 400,
				message: (res.errors && res.errors.length >= 0 ? res.errors[0].status + " - " + res.errors[0].title + " (" + res.errors[0].detail + ")" : "Failed to update Variable.")
			};	
		}
	}).finally(err => {
		return {
			status: 400,
			message: "Invalid Request. Please try again."
		};
	});
}

let addRun = async function(tfeToken, workSpaceId, runMessage, isDestroy = false) {
	return await fetch(tfeDomain + '/api/v2/runs', {
		method: 'POST',
		json: true,
		body: JSON.stringify({
			"data": {
				"attributes": {
					"is-destroy": isDestroy,
					"message": runMessage
				},
				"relationships": {
					"workspace": {
						"data": {
							"type": "workspaces",
							"id": workSpaceId
						}
					}
				}
			}
		}),
		headers: {
			"Content-Type": "application/vnd.api+json",
			"Authorization": "Bearer " + tfeToken
		}
	})
	.then(res => res.json())
	.then(res => {
		if(res.data) {
			return {
				status: 200,
				message: "Request Successful",
				data: res
			};
		}else {
			return {
				status: 400,
				message: (res.errors && res.errors.length >= 0 ? res.errors[0].status + " - " + res.errors[0].title + " (" + res.errors[0].detail + ")" : "Failed to add Run.")
			};	
		}
	}).finally(err => {
		return {
			status: 400,
			message: "Invalid Request. Please try again."
		};
	});
}

try {
	let inputTfeToken 				= 	core.getInput('token');
	let inputOrganizationName 		= 	core.getInput('organization');
	let inputWorkSpace 				= 	core.getInput('workspace');
	let inputMessage 				= 	core.getInput('message');
	let inputVariables 				= 	core.getInput('variables');

	console.log("Step - Getting WorkSpace");
	getWorkSpace(inputTfeToken, inputOrganizationName, inputWorkSpace)
	.then(async (workSpace) => {
		if(workSpace && workSpace !== null) {
			if(inputVariables && inputVariables !== null && inputVariables.length > 0) {
				console.log("Step - Get and set Variables");
				inputVariables = Buffer.from(inputVariables);
				inputVariables = dotenv.parse(inputVariables);

				await getAndSetVariable(inputTfeToken, inputOrganizationName, workSpace.id, inputWorkSpace, inputVariables);
			}

			console.log("Step - Creating Run");
			await addRun(inputTfeToken, workSpace.id, inputMessage, false)
				.then((result) => {
					if(result.status == 200 && result.data && result.data.data) {
						console.log("Step - Run Created Successfully");
						core.setOutput("run-url", tfeDomain + result.data.data.links.self);
					}else {
						core.setFailed(`Failed to create run`);
					}
				})
		}else {
			core.setFailed(`WorkSpace ${inputWorkSpace} not found!`);
		}
	});
} catch (error) {
	core.setFailed(error.message);
}