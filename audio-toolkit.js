'use strict'

const util = require('util')
const { exec } = require('child_process')
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
     //console.log(`Step 4: globby results in: ${tmpDir}*.${toFormat}`, paths)
     return paths
    })
    return Promise.all( fileCopyTasks )
      .then( processTask )
      .then( collectTask )
      .then( (paths) => {
        //console.log('Step 5: complete', paths.length)
        return paths
      })
  }

  // joins files, resolves to destFile
  // implemented with docker script mergeFiles.sh
  mergeFiles(srcFiles, destFile) {
    //console.log('mergefiles: ', srcFiles, destFile)
    if (!srcFiles) throw "MergeFiles warning: srcFile is a required field"
    let ext = path.extname(srcFiles[0]).split('.')[1]
    ////console.log('ext: ', ext) //
    if (!destFile) destFile = tempy.file({ extension: ext })
    //console.log('srcfiles[0], destFile, ext: ', srcFiles[0], destFile, ext)
    const tmpDir = tempy.directory()  + '/'
    const inputDir = 'input/'
    const outputFile = 'output.' + ext
    let fileCopyTasks = srcFiles.map(src => fs.copy(src, tmpDir + inputDir + path.basename(src)) )
    let processTask = () => processAudio(tmpDir,'mergeFiles', inputDir, outputFile)
    let copyTask = () => fs.copy(tmpDir + outputFile, destFile)
    //console.log('tmpDir, inputDir, outputFile: ', tmpDir, inputDir, outputFile)
    return Promise.all( fileCopyTasks )
      .then( processTask )
      .then( copyTask )
      .then( () =>  destFile )
  }

  // splits audio and resolves to array of two dest files
  // implemented with docker script splitFile.sh
  splitFile(srcFile, position, destPart1, destPart2) {
    if (!srcFile||!position)
      throw "SplitFile warning: srcFile & position are required fields"
    let ext = path.extname(srcFile).split('.')[1]
    let aud = this
    if (!destPart1) destPart1 = tempy.file({extension: ext})
    if (!destPart2) destPart2 = tempy.file({extension: ext})
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ ext
    const outputFile1 = 'output1.'+ ext
    const outputFile2 = 'output2.'+ ext
    const processAudioTask = () => processAudio(tmpDir,'splitFile', inputFile, outputFile1, outputFile2, aud.ms2time(position))
    // copy out output files to destFile and resolve to array of 2 destFiles
    const copyFilesTask = () => Promise.all([
      fs.copy(tmpDir+outputFile1, destPart1), fs.copy(tmpDir+outputFile2, destPart2)
    ])
    return fs.copy(srcFile, tmpDir + inputFile)
      .then(processAudioTask)
      .then(copyFilesTask)
      .then( () => [destPart1, destPart2] )
  }

  // insert one file into another, resolves to destFile
  // implemented as split + merge
  insertFragment(srcFile, fragmentFile, position, destFile) {
    var aud = this
    if (!srcFile||!fragmentFile||!position)
     throw "InsertFragment warning: srcFile, fragmentFile and position are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile).split('.')[1]})
    const tmpDir = tempy.directory() + '/'
    const inputFile = 'input'+ path.extname(srcFile)
    const fragFile = 'fragment'+ path.extname(srcFile)
    const outputFile = 'output'+ path.extname(srcFile)
    const processAudioTask = processAudio(tmpDir, 'insertFragment',
      inputFile, fragFile, outputFile, aud.ms2time(position))
    const copyFileTasks = () => Promise.all([
      fs.copy(srcFile, tmpDir + inputFile),
      fs.copy(fragmentFile, tmpDir + fragFile)
    ])
    return copyFileTasks()
      .then( () => processAudioTask )
      .then( () =>  fs.copy(tmpDir + outputFile, destFile) )
      .then( () => destFile )
    // return aud.splitFile(srcFile, position).then((files) => {
    //   return aud.mergeFiles([files[0], fragmentFile, files[1]], destFile)
    // })
  }

  // deletes section, resolves to destFile
  // implemented as split + split + merge
  deleteSection(srcFile, fromPos, toPos, destFile) {
    var aud = this
    if (!srcFile||!fromPos||!toPos)
     throw "DeleteSection warning: srcFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile).split('.')[1]})
    const tmpDir = tempy.directory() + '/'
    const inputFile = 'input'+ path.extname(srcFile)
    const outputFile = 'output'+ path.extname(srcFile)
    const processAudioTask = processAudio(tmpDir, 'deleteSection',
      inputFile, outputFile, aud.ms2time(fromPos), aud.ms2time(toPos) )
    const copyFileTask = () => fs.copy(srcFile, tmpDir + inputFile)

    return copyFileTask()
      .then( () => processAudioTask )
      .then( () =>  fs.copy(tmpDir + outputFile, destFile) )
      .then( () => destFile )

    // var partA, partB
    // return aud.splitFile(srcFile, toPos).then((files) => {
    //   partB = files[1]
    //   return aud.splitFile(files[0], fromPos).then((files) => {
    //     partA = files[0]
    //   })
    // })
    // .then(()=>aud.mergeFiles([partA, partB], destFile))
  }

  // deletes section, resolves to destFile
  // implemented as split + split + merge
  replaceSection(srcFile, fragmentFile, fromPos, toPos, destFile) {
    if (!srcFile||!fragmentFile||!fromPos||!toPos)
     throw "ReplaceSection warning: srcFile, fragmentFile, fromPos and toPos are required fields"
    var aud = this
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile).split('.')[1]})
    var partA, partB
    return aud.splitFile(srcFile, toPos).then((files) => {
      partB = files[1]
      return aud.splitFile(files[0], fromPos).then((files) => {
        partA = files[0]
      })
    }).then( () => aud.mergeFiles([partA, fragmentFile, partB], destFile) )
  }

  // returns obj with file size, audio length, format, bitrate etc.
  // implemented with docker script getMetaData.sh
  getMetaData(srcFile) {
    if (!srcFile) throw "GetMetaData warning: srcFile is a required field"
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input'+ path.extname(srcFile)
    const outputFile = 'output.json'
    const aud = this
    return fs.copy(srcFile, tmpDir + inputFile)
      .then(
        () => processAudio(tmpDir,'getMetaData', inputFile, outputFile)
      ).then(
        () => fs.readFile(tmpDir + outputFile).then(  (data) => {
          let result = {}
          data = data.toString().trim()
          //console.log(data)
          result.duration = data.replace(/.*?Duration:\s([0-7.:]+?)\,.*/ig, '$1')
          result.bitrate = data.replace(/.*?bitrate:\s(.*?)\skb\/s.*/ig, '$1')
          result.duration_ms = aud.time2ms(result.duration)
          return result
        })
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
    const inputFile = 'input'+ path.extname(srcFile)
    const outputFile = 'output'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpDir + inputFile)
      .then(
        () => processAudio(tmpDir,'normalizeLevels', inputFile,outputFile)
      ).then(
        () => fs.copy(tmpDir + outputFile, destFile)
      ).then(
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
    return fs.copy(srcFile, tmpDir + inputFile)
    .then(
      () => processAudio(tmpDir,'normalizeSilence', inputFile,outputFile)
    ).then(
      () => fs.copy(tmpDir+outputFile, destFile)
    ).then(
      () => destFile
    )
  }

  checkDir(directory) {
    if (directoryExists.sync(directory)) console.log(` Directory "${directory}" found`)
     else console.log(` Directory "${directory}" not found`)
  }
  checkFile(filename) {
    if (fileExists.sync(filename)) console.log(` File "${filename}" found`)
     else console.log(` File "${filename}" not found`)
  }

  ms2time(milliseconds) {
    let s, m, h, ms;
    s = Math.floor( milliseconds / 1000 ); // total seconds
    ms = milliseconds - (s*1000) // ms remainder
    m = Math.floor( s / 60 ) // total minutes
    h = Math.floor( m / 60 ) // hours
    m = m % 60; // minutes
    s = s % 60; // seconds
    ms = ms.toString().substr(0,3) // we only want 3 digits of ms
    // adding a leading zeros if necessary
    if ( s < 10 ) s = '0' + s
    if ( m < 10 ) m = '0' + m
    if ( h < 10 ) h = '0' + h
    return  h + ':' + m + ':' + s + (ms.length? '.'+ms : '')
  }
  time2ms(timestring) {
    let [d,ms] = timestring.split('.')
    let [h,m,s] = d.split(':')
    return (Number(h)*60*60*1000) + (Number(m)*60*1000) + (Number(s)*1000) + Number(ms)
  }

}

module.exports = AudioToolkit

/*
   Internal, not exported
*/



function processAudio(sharedDir, scriptName, ...args){
  return new Promise((resolve, reject) => {
    //console.log('Step 1: call processAudio')
    let cmd = `docker run --rm -v ${sharedDir}:/data dockerffmpeg ${scriptName}.sh ${args.join(' ')}`
    console.log('Exec: '+ cmd)

    // A hack to resolve when the script is done
    chokidar.watch(sharedDir+'taskcomplete.marker').on('add', () => {
      //  console.log('Step 3: file resolver -- marker file found')
      return resolve(true)
    })

    //call the docker script
    exec(cmd, (error, stdout, stderr) => { // never fires
      //  console.log('Step 3: docker completed, this is not usually being called')
      if (error) return reject(error)
      return resolve(stdout)
    })
  })
}
