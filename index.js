'use strict'

var fs = require('fs')
const exec = require('child_process').exec

module.exports.convertAllFiles = function(folderPath, inputExtension, outputExtension) {
	return audioProcess(folderPath, 'convertAllFiles', inputExtension, outputExtension)
}

module.exports.combineAllFiles = function(folderPath, extension) {
	return audioProcess(folderPath, 'combineAllFiles', extension)
}

module.exports.insertAudio = function(inputFile, segmentFile, atPos, outputFile) {
	let inputFileName = inputFile.split('/').pop();
	let segmentFileName = segmentFile.split('/').pop();
	createTempFolder(inputFile, segmentFile)
	.then((folderpath) => {
		audioProcess(folderPath, 'insertAudio', inputFileName, segmentFileName, atPos)
		.then((output) => {
			// Copy the temporary output file to outputFile location
			
			// Remove the temporary folder
			
		})
	})
	.catch((err) => {
		reject(err)
	})
}

module.exports.deleteAudio = function(inputFile, fromPos, toPos, outputFile) {
	let inputFileName = inputFile.split('/').pop();
	createTempFolder(inputFile)
	.then((folderPath) => {
		audioProcess(folderPath, 'deleteAudio', inputFileName, fromPos, toPos)
		.then((output) => {
			// Copy the temporary output file to outputFile location
			
			// Remove the temporary folder
			
		})
		.catch((err) => {
			reject(err);
		})
	})
	.catch((err) => {
		reject(err)
	})
}

module.exports.replaceAudio = function(inputFile, segmentFile, fromPos, toPos, outputFile) {
	let inputFileName = inputFile.split('/').pop();
	let segmentFileName = segmentFile.split('/').pop();
	createTempFolder(inputFile, segmentFile)
	.then((folderPath) => {
		audioProcess(folderPath, 'replaceAudio', inputFileName, segmentFileName, fromPos, toPos)
		.then((output) => {
			// Copy the temporary output file to outputFile location
			
			// Remove the temporary folder
			
		})
		.catch((err) => {
			reject(err);
		})
	})
}

module.exports.extractFile = function(inputFile, fromPos, toPos, outputFile) {
	
}

module.exports.splitFile = function(inputFile, atPos, outputFile1, outputFile2) {
	let inputFileName = inputFile.split('/').pop();
	createTempFolder(inputFile)
	.then((folderPath) => {
		audioProcess(folderPath, 'splitFile', inputFileName, atPos)
		.then((output) => {
			// Copy the temporary output files to outputFile1 and outputFile2
			
			// Remove the temporary folder
			
		})
		.catch((err) => {
			reject(err);
		})
	})
}

module.exports.joinFiles = function(outputFile, ...inputFiles) {
	let extension = inputFiles[0].split('.').pop();
	// Throw an error if the inputFiles are not all the same extension
	
	
	createTempFolder(inputFiles...)
	.then((folderPath) => {
		return audioProcess(folderPath, 'combineAllFiles', extension)
	})
	.catch((err) => {
		reject(err);
	})
}

prepEnvironment = function(){
	return new Promise(function(resolve, reject) {
		let docker = exec('"eval $(docker-machine env default)"')
		docker.stdout.on('close', code => {
			resolve($(code))
		})
		docker.stdout.on('exit', code => {
			resolve($(exit))
		})
		docker.stdout.on('error', err => {
			reject(err)
		})
	}	
}

function audioProcess(folderPath, taskName, ...args){
	return new Promise(function(resolve, reject) {
		fs.ensureDir(folderPath, function(err){
			if(err) reject(err)
			else {
				let prep = prepEnvironment()
				prep.then(function(result){
					let docker = exec("'docker' run --rm -d -v " + folderPath + ":/data /app/" + taskName + ".sh " + join(' ', args))
					docker.stdout.on('close', code => {
						resolve($(code))
					})
					docker.stdout.on('exit', code => {
						resolve($(exit))
					})
					docker.stdout.on('error', err =>{
						reject(err)
					})				
				},
				function(err) {
					reject(err)
				})
			}
		}	
	}
}

function createTempFolder(...files) {
	return new Promise(function(resolve, reject){
		// create a new temporary folder
		
		// copy all ...files into temporary folder
		
		// ensure that the files were properly copied to the folder
		
		// resolve with name of the temporary folder
		
	})
}

