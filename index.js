'use strict'

var fs = require('fs')
const exec = require('child_process').exec

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

/**
 * Task list 
 *
 * AF: Audio File for an entire audiobook
 * BLAF: Block Level Audio File for a single section
 *
 * - import: converts disparate audio files to .flac and joins into AF
 * - combineAll: joins BLAFs into AF, e.g. to prepare for mastering
 * - insert: inserts an audio selection into a BLAF
 * - delete: deletes an audio selection from a BLAF
 * - replace: replaces an audio selection from a BLAF
 * - splitBlock: splits a BLAF into two
 * - joinBlocks: joins two BLAFs into one
 * - export: convert to .ogg or .mp3 (TODO: choose) for publishing
 */
module.exports.ffmpeg = function(data_folder_path, task_name, ...args){
	return new Promise(function(resolve, reject) {
		fs.ensureDir(data_folder_path, function(err){
			if(err) reject(err)
			else {
				let prep = prepEnvironment()
				prep.then(function(result){
					let docker = exec("'docker' run --rm -d -v " + data_folder_path + ":/data /app/" + task_name + ".sh " + join(' ', args))
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
		