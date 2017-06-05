'use strict'

var fs = require('fs')
const exec = require('child_process').exec
			

prepEnvironment = function(){
	return new Promise(function(resolve, reject) {
		let docker = exec('"eval $(docker-machine env default"')
		docker.stdout.on('close', code => {
			resolve($(code))
		})
		docker.stdout.on('exit', code => {
			resolve($(exit))
		})
		docker.stdout.on('error', err =>{
			reject(err)
		})
	}	
}

module.exports.mergeFiles = function(data_folder_path){
	return new Promise(function(resolve, reject) {
		fs.ensureDir(data_folder_path, function(err){
			if(err) reject(err)
			else {
				let prep = prepEnvironment()
				prep.then(function(result){
					let docker = exec("'docker' run --rm  --entrypoint='bash' -v $(pwd)/test:/data ffmpeg_merge merge_files.sh")
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
		