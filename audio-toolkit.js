'use strict'

const util = require('util')
const { exec } = require('child_process')
 //const execP = util.promisify(exec);
const tempy =  require('tempy')
const fs =     require('fs-extra')
const globby = require('globby')
const path   = require('path')

const fileExists = require('file-exists')
const directoryExists = require('directory-exists')

const chokidar = require('chokidar')



class AudioToolkit {
  constructor() {
    // in case we need some instantiated object data
  }

  // resolves to an array of converted files
  // implemented with docker script convertFormat.sh
  convertFormat(srcFiles, toFormat) {
    // console.log('convertFormat', srcFiles, toFormat)
    if (!srcFiles || !toFormat)
     throw "ConvertFormat warning: srcFile & toFormat are required fields"
    if (!toFormat) toFormat = 'flac' // default format
    const tmpDir = tempy.directory() + '/'
    let fileCopyTasks = srcFiles.map(src => fs.copy(src, tmpDir + path.basename(src)) )
    let processTask = () => processAudio(tmpDir,'convertFormat', toFormat)
    let collectTask = () => globby(`${tmpDir}*.${toFormat}`).then(paths => {
     console.log(`Step 4: globby results in: ${tmpDir}*.${toFormat}`, paths)
     return paths
    })
    return Promise.all( fileCopyTasks )
      .then( processTask )
      .then( collectTask )
      .then( (paths) => {
        console.log('Step 5: complete', paths.length)
        return paths
      })
  }

  // joins files, resolves to destFile
  // implemented with docker script mergeFiles.sh
  mergeFiles(srcFiles, destFile) {
    if (!srcFile||!destFile)
      throw "MergeFiles warning: srcFile & destFile are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const inputDir = 'input/'
    const outputFile = 'output.' + path.extname(destFile)
    return Promise.All(
      srcFiles.map((src) => fs.copy(src, tmpDir + inputDir))
    ).then(
        // # Merges all files in the "/data/source/" folder and saves to outputFile
        // #  converting format if necessary.
        // # $1 (inputDir): source files
        // # $2 (outputFile): merged output file
      processAudio(tmpDir,'mergeFiles', inputDir,outputFile)
    ).then (
      fs.copy(tmpDir+outputFile, destFile)
    )
  }

  // splits audio and resolves to array of two dest files
  // implemented with docker script splitFile.sh
  splitFile(srcFile, position, destPart1, destPart2) {
    if (!srcFile||!position||!toPos)
      throw "SplitFile warning: srcFile & position are required fields"
    if (!destPart1) destPart1 = tempy.file({extension: path.extname(srcFile)})
    if (!destPart2) destPart2 = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ path.extname(srcFile)
    const outputFile1 = 'output1.'+ path.extname(srcFile)
    const outputFile2 = 'output2.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpDir + inputFile).then(
      // Splits inputFile into two files: outputFile1 & outputFile2
      // $1 inputFile: The file name of the source audio, with extension.
      // $2 outputFile1: The filename for the audio before the split position.
      // $3 outputFile2: The filename for the audio after the split position.
      // $4 position: The position at which the source file should be split.
      processAudio(tmpDir,'splitFile', inputFile,outputFile1,outputFile2,position)
    ).then(
      // copy out output files to destFile and resolve to array of 2 destFiles
      Promise.all([
        fs.copy(tmpDir+outputFile1, destPart1),
        fs.copy(tmpDir+outputFile2, destPart2)
      ])
    ).then(
      // resolve to an array of two files
      () => [destPart1, destPart2]
    )
  }

  // insert one file into another, resolves to destFile
  // implemented as split + merge
  insertFragment(srcFile, fragmentFile, position, destFile) {
    if (!srcFile||!fragmentFile||!position)
     throw "InsertFragment warning: srcFile, fragmentFile and position are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    return splitFile(srcFile, position).done((files) => {
      return mergeFile([files[0], fragementFile, files[1]], destFile)
    })
  }

  // deletes section, resolves to destFile
  // implemented as split + split + merge
  deleteSection(srcFile, fromPos, toPos, destFile) {
    if (!srcFile||!fromPos||!toPos)
     throw "DeleteSection warning: srcFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    var partA, partB
    return splitFile(srcFile, toPos).done((files) => {
      partB = files[1]
      return splitFile(files[0], fromPos).done((files) => {
        partA = files[0]
      })
    }).done(
      mergeFile([partA, partB], destFile)
    )
  }

  // deletes section, resolves to destFile
  // implemented as split + split + merge
  replaceSection(srcFile, fragmentFile, fromPos, toPos, destFile) {
    if (!srcFile||!fragmentFile||!fromPos||!toPos)
     throw "ReplaceSection warning: srcFile, fragmentFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    var partA, partB
    return splitFile(srcFile, toPos).done((files) => {
      partB = files[1]
      return splitFile(files[0], fromPos).done((files) => {
        partA = files[0]
      })
    }).done(
      mergeFile([partA, fragmentFile, partB], destFile)
    )
  }

  // returns obj with file size, audio length, format, bitrate etc.
  // implemented with docker script getMetaData.sh
  getMetaData(srcFile) {
    if (!srcFile) throw "GetMetaData warning: srcFile is a required field"
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      //  Gets audio metadata from a source audio file within the /data folder.
      //  $1 inputFile: The file name of the source audio, with extension.
      processAudio(tmpDir,'getMetaData', inputFile).done(
        (metaData) => metaData
      )
    )
  }

  // normalize volume levels
  // implemented with docker script normalizeLevels.sh
  // options not yet implemented
  normalizeLevels(srcFile, destFile, options) {
    // TODO: implement some options
    if (!srcFile) throw "NormalizeLevels warning: srcFile is a required field"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ path.extname(srcFile)
    const outputFile = 'output.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpDir + inputFile).done(
      // Normalizes audio levels for a source audio file in the /data folder.
      // $1 inputFile: The file name of the source audio, with extension.
      // $2 outputFile: The file name of the destination audio, with extension.
      // TODO: Any additional parameters should be considered as options for the ffmpeg
      // normalization routine.
      processAudio(tmpDir,'normalizeLevels', inputFile,outputFile)
    ).done(
      // copy output file to destFile and resolve to destFile
      fs.copy(tmpDir+outputFile, destFile)
    ).done(
      () => destFile
    )
  }

  // normalize silence length - remove excess inside and standardize edges
  // implemented with docker script normalizeSilence.sh
  // options not yet implemented
  normalizeSilence(srcFile, destFile, options) {
    // TODO: implement some options
    if (!srcFile) throw "normalizeSilence warning: srcFile is a required field"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ path.extname(srcFile)
    const outputFile = 'output.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpDir + inputFile).done(
      // Normalizes silence
      // $1 inputFile: The file name of the source audio, with extension.
      // $2 outputFile: The file name of the destination audio, with extension.
      // TODO: Any additional parameters should be considered as options for the ffmpeg
      // normalization routine.
      processAudio(tmpDir,'normalizeSilence', inputFile,outputFile)
    ).done(
      // copy output file to destFile and resolve to destFile
      fs.copy(tmpDir+outputFile, destFile)
    ).done(
      () => destFile
    )
  }

}

module.exports = AudioToolkit

/*
   Internal, not exported
*/

function checkDir(directory) {
  if (directoryExists.sync(directory)) console.log(` Directory "${directory}" found`)
   else console.log(` Directory "${directory}" not found`)
}
function checkFile(filename) {
  if (fileExists.sync(filename)) console.log(` File "${filename}" found`)
   else console.log(` File "${filename}" not found`)
}


function processAudio(sharedDir, scriptName, ...args){
  return new Promise((resolve, reject) => {
    console.log('Step 1: call processAudio')
    let cmd = `docker run --rm -v ${sharedDir}:/data dockerffmpeg ${scriptName}.sh ${args.join(' ')}`
    console.log('Exec: '+ cmd)

    // A hack to resolve when the script is done
    chokidar.watch(sharedDir+'taskcomplete.marker').on('add', () => {
      console.log('Step 3: file resolver -- marker file found')
      return resolve(true)
    })

    //call the docker script
    exec(cmd, (error, stdout, stderr) => { // never fires
      console.log('Step 2: docker completed')
      //if (error) return reject(error)
      //return resolve(stdout)
    })
  })
}

// function prepEnvironment() {
//   return new Promise(function(resolve, reject) {
//     let docker = exec('"eval $(docker-machine env default)"')
//     docker.stdout.on('close', code => resolve($(code)) )
//     docker.stdout.on('exit', code =>  resolve($(exit)) )
//     docker.stdout.on('error', err => reject(err) )
//   })
// }
