'use strict'

const exec =   require('child_process').exec
const mv =     require('mv') // not using yet
const tempy =  require('tempy')
const fs =     require('fs-extra')
const globby = require('globby')
const path   = require('path')



class AudioToolkit {
  constructor() {
    // in case we need some instantiated object data
  }

  // resolves to an array of converted files
  convertFormat(srcFiles, toFormat) {
    //console.log('convertFormat', srcFiles, toFormat)
    if (!srcFiles||!toFormat)
     throw "ConvertFormat warning: srcFile & toFormat are required fields"
    // TODO, check that all extensions in srcFiles match
    // TODO, check toFormat against a list of availble formats
    if (!toFormat) toFormat = 'flac' // default format
    const tmpDir = tempy.Directory +'/'
    const srcDir = 'source/'
    const destDir = 'dest/'
    // copy files to tmp directory, process entire folder, resolve array of converted files
    return Promise.all([
      // create the subdirs
      fs.ensureDir(tmpDir+srcDir), fs.ensureDir(tmpDir+destDir)
    ]).then(Promise.all(
      srcFiles.map(src => fs.copy(src, srcDir + fileName(src)) )
    )).then(
      // Converts all files in the /data/source/ folder to a specified format.
      // $1 (toFormat): The destination format.
      // $2 (srcDir): Folder containing source files
      // $3 (destDir): Folder with converted files
      processAudio(tmpDir, 'convertFormat', toFormat, srcDir, destDir)
    ).then(
      globby(destDir+'*.'+toFormat).then(paths => {
         //console.log('globby results in: '+destDir+'*.'+toFormat, paths)
         return paths
      })
    )
  }

  // joins files, resolves to destFile
  mergeFiles(srcFiles, destFile) {
    if (!srcFile||!destFile)
      throw "MergeFiles warning: srcFile & destFile are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const srcDir = 'source/'
    const outputFile = 'output.' + path.extname(destFile)
    return Promise.All(
      srcFiles.map((src) => fs.copy(src, tmpDir))
    ).then(
        // # Merges all files in the "/data/source/" folder and saves to outputFile
        // #  converting format if necessary.
        // # $1 (srcDir): source files
        // # $2 (outputFile): merged output file
      processAudio(tmpDir, 'mergeFiles', srcDir, outputFile)
    ).then (
      fs.copy(tmpDir+outputFile, destFile)
    )
  }

  // insert one file into another, resolves to destFile
  insertFragment(srcFile, fragmentFile, position, destFile) {
    if (!srcFile||!fragmentFile||!position)
     throw "InsertFragment warning: srcFile, fragmentFile and position are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpFrag = tmpDir + 'fragAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(fs.copy(fragementFile, tmpFrag).then(
    /**
# Inserts an audio fragment into a source audio file at a given position.
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension
# $2 (fragmentFileName) = The file name of the fragment audio, with extension
# $3 (position) = The position at which to insert the fragment audio
# $4 (destFileName) = The output file name
     */
      processAudio(tmpDir, 'insertFragment', fileName(tmpSrc), fileName(tmpFrag), position, fileName(tmpDest)).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    ))
  }

  // deletes section, resolves to destFile
  deleteSection(srcFile, fromPos, toPos, destFile) {
    if (!srcFile||!fromPos||!toPos)
     throw "DeleteSection warning: srcFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      /**
# Deletes a selection of audio from a source audio file in the /data folder.
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension.
# $2 (fromPos) = The position at which to begin deletion.
# $3 (toPos) = The position at which to stop deletion.
# $4 (destFileName) = The output file name.
       */
      processAudio(tmpDir, 'deleteSection', fileName(tmpSrc), fileName(tmpDest), fromPos, toPos).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    )
  }

  // deletes section, resolves to destFile
  replaceSection(srcFile, fragmentFile, fromPos, toPos, destFile) {
    if (!srcFile||!fragmentFile||!fromPos||!toPos)
     throw "ReplaceSection warning: srcFile, fragmentFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpFrag = tmpDir + 'fragAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return Promise.all([ fs.copy(srcFile, tmpSrc),
      fs.copy(fragementFile, tmpFrag) ]).done(
      /**
# Replaces a selection of audio within the source file with the audio in a
# fragment file. Both source and fragment audio must be in the /data folder.
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension.
# $2 (fragmentFile) = The file name of the fragment audio, with extension.
# $3 (fromPos) = The position at which to begin deletion.
# $4 (toPos) = The position at which to stop deletion.
# $5 (destFileName) = The output file name.
      */
      processAudio(tmpDir, 'replaceSection', fileName(tmpSrc), fileName(tmpFrag), fileName(tmpDest), fromPos, toPos).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    ))
  }

  // splits audio and resolves to array of two dest files
  splitFile(srcFile, position, destPart1, destPart2) {
    if (!srcFile||!position||!toPos)
     throw "SplitFile warning: srcFile & position are required fields"
    if (!destPart1) destPart1 = tempy.file({extension: path.extname(srcFile)})
    if (!destPart2) destPart2 = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest1 = tmpDir + 'destAudio1.'+ path.extname(srcFile)
    const tmpDest2 = tmpDir + 'destAudio2.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      /**
# Splits a file in the /data folder into two files.
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension.
# $2 (position) = The position at which the source file should be split.
# $3 (destFile1) = The filename for the audio before the split position.
# $4 (destFile2) = The filename for the audio after the split position.
       */
      processAudio(tmpDir, 'splitFile', fileName(tmpSrc), fileName(tmpDest1),  fileName(tmpDest2), position).done(
        // copy output file to destFile and resolve to array of 2 destFiles
        fs.copy(tmpDest1, destPart1).then(fs.copy(tmpDest2, destPart2).done(
          () => [destPart1, destPart2]
        ))
      )
    )
  }

  // returns obj with file size, audio length, format, bitrate etc.
  getMetaData(srcFile) {
    if (!srcFile)
     throw "GetMetaData warning: srcFile is a required field"
    const tmpDir = tempy.directory()  + '/'
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      /**
# Gets audio metadata from a source audio file within the /data folder.
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension.
       */
      processAudio(tmpDir, 'getMetaData', fileName(tmpSrc)).done(
        (metaData) => metaData
      )
    )
  }

  // normalize volume levels
  normalizeLevels(srcFile, destfile, options) {
    // TODO: implement some options
    if (!srcFile)
     throw "NormalizeLevels warning: srcFile is a required field"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(fs.copy(destfile, tmpDest).then(
    /**
# Normalizes audio levels for a source audio file in the /data folder.
#
# Parameters:
# $1 (sourceFileName) = The file name of the source audio, with extension.
# $2 (destFileName) = The file name of the destination audio, with extension.
#
# Any additional parameters should be considered as options for the ffmpeg
# normalization routine.
     */
      processAudio(tmpDir, 'normalizeLevels', fileName(tmpSrc), fileName(tmpDest)).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    ))
  }


}

module.exports = AudioToolkit


/*
   Internal, not exported
*/

function changeExt(fp, ext) {
  let parts = fp.split('.')
  parts[parts.length-1] = ext
  return parts.join('.')
}
function fileName(fp, ext) {
  let fn = path.basename(fp)
  if (ext) fn = changeExt(fp, ext)
  return fn
}

function processAudio(folderPath, taskName, ...args){
  //console.log('processAudio', folderPath, taskName)
  return new Promise(function(resolve, reject) {
    //return resolve(true);
  //  prepEnvironment().then( () => {
      args = args.join(' ')
      // IMPORTANT: this command will NOT work unless the docker image is built
      // and properly tagged as "dockerffmpeg". Should be done at npm install.
      // Use the following command: docker build -t dockerffmpeg .
      let cmd = `'docker' run --rm -d -v ${folderPath}:/data dockerffmpeg ${taskName}.sh ${args}`
      console.log('Exec: '+ cmd)
      //resolve(true)
      let docker = exec(cmd)
      docker.stdout.on('close', code =>  resolve($(code)) )
      docker.stdout.on('exit', code =>  resolve($(exit)) )
      docker.stdout.on('error', err => reject(err) )
    //})
  })
}

function prepEnvironment() {
  return new Promise(function(resolve, reject) {
    let docker = exec('"eval $(docker-machine env default)"')
    docker.stdout.on('close', code => resolve($(code)) )
    docker.stdout.on('exit', code =>  resolve($(exit)) )
    docker.stdout.on('error', err => reject(err) )
  })
}








/*


module.exports.deleteAudio = function(inputFile, fromPos, toPos, outputFile) {
  let inputFileName = inputFile.split('/').pop();
  createTempFolder(inputFile)
  .then((folderPath) => {
    processAudio(folderPath, 'deleteAudio', inputFileName, fromPos, toPos)
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
    processAudio(folderPath, 'replaceAudio', inputFileName, segmentFileName, fromPos, toPos)
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
    processAudio(folderPath, 'splitFile', inputFileName, atPos)
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
    return processAudio(folderPath, 'combineAllFiles', extension)
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

function processAudio(folderPath, taskName, ...args){
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

*/
