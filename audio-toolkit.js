'use strict'

const exec =   require('child_process').exec
//const mv =     require('mv') // not using yet
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
    const inputDir = 'input/'
    const outputDir = 'output/'
    // copy files to tmp directory, process entire folder, resolve array of converted files
    return Promise.all([
      // create the subdirs
      fs.ensureDir(tmpDir + inputDir), fs.ensureDir(tmpDir + outputDir)
    ]).then(Promise.all(
      srcFiles.map(src => fs.copy(src, tmpDir + inputDir + path.basename(src)) )
    )).then(
      // Converts all files in the /data/source/ folder to a specified format.
      // $1 toFormat: The destination format.
      // $2 inputDir: Folder containing source files
      // $3 outputDir: Folder with converted files
      processAudio(tmpDir,'convertFormat', toFormat,inputDir,outputDir)
    ).then(
      globby(outputDir+'*.'+toFormat).then(paths => {
         //console.log('globby results in: '+destDir+'*.'+toFormat, paths)
         return paths
      })
    )
  }

  // joins files, resolves to destFile, make sure they are all the same format!!
  mergeFiles(srcFiles, destFile) {
    if (!srcFile||!destFile)
      throw "MergeFiles warning: srcFile & destFile are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const inputDir = 'input/'
    const outputFile = 'output.' + path.extname(destFile)
    return Promise.All(
      srcFiles.map((src) => fs.copy(src, tmpDir))
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
  splitFile(srcFile, position, destPart1, destPart2) {
    if (!srcFile||!position||!toPos)
      throw "SplitFile warning: srcFile & position are required fields"
    if (!destPart1) destPart1 = tempy.file({extension: path.extname(srcFile)})
    if (!destPart2) destPart2 = tempy.file({extension: path.extname(srcFile)})
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ path.extname(srcFile)
    const outputFile1 = 'output1.'+ path.extname(srcFile)
    const outputFile2 = 'output2.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).done(
      // Splits inputFile into two files: outputFile1 & outputFile2
      // $1 inputFile: The file name of the source audio, with extension.
      // $2 outputFile1: The filename for the audio before the split position.
      // $3 outputFile2: The filename for the audio after the split position.
      // $4 position: The position at which the source file should be split.
      processAudio(tmpDir,'splitFile', inputFile,outputFile1,outputFile2,position)
    ).done(
      // copy out output files to destFile and resolve to array of 2 destFiles
      Promise.all([
        fs.copy(tmpDir+outputFile1, destPart1),
        fs.copy(tmpDir+outputFile2, destPart2)
      ])
    ).done(
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


}

module.exports = AudioToolkit


/*
   Internal, not exported
*/


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
