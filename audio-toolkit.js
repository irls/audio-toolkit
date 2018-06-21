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
    let fileCopyTasks = srcFiles.map((src, i) => fs.copy(src, tmpDir + inputDir + ('0'.repeat(11 - ('' + i).length)) + i + '-' + path.basename(src)) )
    let processTask = () => processAudio(tmpDir,'mergeFiles', inputDir, outputFile)
    let copyTask = () => fs.copy(tmpDir + outputFile, destFile)
    let self = this;
    //console.log('tmpDir, inputDir, outputFile: ', tmpDir, inputDir, outputFile)
    return Promise.all( fileCopyTasks )
      .then( processTask )
      .then( copyTask )
      .then( () =>  {
        self._removeDirRecursive(tmpDir);
        return Promise.resolve(destFile)
      })
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
    let self = this;

    return copyFileTask()
      .then( () => processAudioTask )
      .then( () =>  fs.copy(tmpDir + outputFile, destFile) )
      .then( () => {
        self._removeDirRecursive(tmpDir);
        return Promise.resolve(destFile)
      } )

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

    const tmpDir = tempy.directory() + '/'
    const inputFile = 'input'+ path.extname(srcFile)
    const fragFile = 'fragment'+ path.extname(srcFile)
    const outputFile = 'output'+ path.extname(srcFile)
    const processAudioTask = processAudio(tmpDir, 'replaceSection',
      inputFile, fragFile, outputFile, aud.ms2time(fromPos), aud.ms2time(toPos) )
    const copyFileTask = () => fs.copy(srcFile, tmpDir + inputFile)

    const copyFileTasks = () => Promise.all([
      fs.copy(srcFile, tmpDir + inputFile),
      fs.copy(fragmentFile, tmpDir + fragFile)
    ])
    return copyFileTasks()
      .then( () => processAudioTask )
      .then( () =>  fs.copy(tmpDir + outputFile, destFile) )
      .then( () => destFile )


    // var partA, partB
    // return aud.splitFile(srcFile, toPos).then((files) => {
    //   partB = files[1]
    //   return aud.splitFile(files[0], fromPos).then((files) => {
    //     partA = files[0]
    //   })
    // }).then( () => aud.mergeFiles([partA, fragmentFile, partB], destFile) )
  }
  
  insertSilence(srcFile, silenceLength, position, destFile, append) {
    if (!srcFile || !silenceLength || typeof position === 'undefined') {
      throw "Insert silence warning: srcFile and silenceLength and position are required fields"
    }
    
    let srcExt = path.extname(srcFile).split('.')[1];
    if (!destFile) {
      destFile = 'target.' + srcExt;
    }
    if (typeof append === 'undefined') {
      append = 0;
    }
    let destExt = path.extname(destFile).split('.')[1];
    const tmpDir = tempy.directory() + '/';
    const inputFile = 'source.'+ srcExt;
    const copyFileTasks = () => Promise.all([
      fs.copy(srcFile, tmpDir + inputFile)
    ])
    return copyFileTasks()
      .then(() => {
        return processAudio(tmpDir, 'insertSilence', silenceLength, inputFile, position, destFile, append)
          .then(() => {
            return tmpDir + destFile;
          });
      })
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
          result.duration = data.replace(/.*?Duration:\s([0-9.:]+?)\,.*/ig, '$1')
          result.bitrate = data.replace(/.*?bitrate:\s(.*?)\skb\/s.*/ig, '$1')
          result.duration_ms = aud.time2ms(result.duration)
          aud._removeDirRecursive(tmpDir);
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
  
  /**
   * Gets interval from audiofile
   * srcFile - audiofile
   * start - start position, in seconds
   * end - end position in seconds
   * dest - the result file
   * @returns {Promise}
   */
  getInterval(srcFile, start, end, dest) {
    if (!srcFile||typeof start === 'undefined'||!end||(start>end))
      throw "getInterval warning: srcFile & start position & end position are required fields, start should be less than end"
    let ext = path.extname(srcFile).split('.')[1]
    let aud = this
    start = parseFloat(start);
    end = parseFloat(end);
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input.'+ ext
    const outputFile = 'output.'+ ext
    const inputCopyTask = fs.copy(srcFile, tmpDir + inputFile);// copy input file to temp directory
    return Promise.all([inputCopyTask])
      .then(() => {
        return processAudio(tmpDir,'getInterval', inputFile, outputFile, start, end - start)
          .then(() => {
            return fs.copy(tmpDir+outputFile, dest)// copy result file to destination directory
              .then(() => {
                fs.remove(tmpDir.replace(/\/$/, ''));// remove temporary directory
                return Promise.resolve(dest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          })
          .catch(err => {
            return Promise.reject(err);
          });
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }
  
  detectSilence(source, db = null, length = null) {
    if (!source) {
      throw "detectSilence warning: source is required";
    }
    if (db === null) {
      db = '-50dB';
    }
    if (length === null) {
      length = 3;
    }
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input'+ path.extname(source)
    const outputFile = 'output.json'
    const aud = this
    return fs.copy(source, tmpDir + inputFile)
      .then(
        () => processAudio(tmpDir,'detectSilence', inputFile, outputFile, db, length)
      ).then(
        () => fs.readFile(tmpDir + outputFile).then(  (data) => {
          let result = [];
          data = data.toString().trim()
          //console.log(data)
          var regExpStart = /silence_start: ([-]?[\d\.]+)/gi
          var regExpEnd = /silence_end: ([-]?[\d\.]+)/gi
          var match_start = null;
          
          while (match_start = regExpStart.exec(data)) {
            if (match_start && typeof match_start[1] !== 'undefined') {
              var match_end = regExpEnd.exec(data);
              if (match_end && typeof match_end[1] !== 'undefined') {
                if (match_start[1].indexOf('-') !== -1) {
                  match_start[1] = 0;
                }
                if (match_end[1].indexOf('-') !== -1) {
                  match_end[1] = 0;
                }
                result.push({
                  start: parseFloat(match_start[1]),
                  end: parseFloat(match_end[1])
                });
              }
            }
          }
          aud._removeDirRecursive(tmpDir);
          return Promise.resolve(result)
        })
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
    if ( ms.length > 0 && ms.length < 3 ) {
      let strpad = '000';
      ms = strpad.substring(0, strpad.length - ms.length) + ms;
    }
    return  h + ':' + m + ':' + s + (ms.length? '.'+ms : '')
  }
  time2ms(timestring) {
    let [d,ms] = timestring.split('.')
    let [h,m,s] = d.split(':')
    return (Number(h)*60*60*1000) + (Number(m)*60*1000) + (Number(s)*1000) + Number(ms)
  }
  
  _removeParentDir(file) {
    let parts = file.split('/');
    parts.splice(parts.length - 1, 1);
    this._removeDirRecursive(parts.join('/'))
  }
  
  _removeDirRecursive(path) {
    if (fs.existsSync(path)) {
      var self = this;
      fs.readdirSync(path).forEach(function(file, index){
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          self._removeDirRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

}

module.exports = AudioToolkit

/*
   Internal, not exported
*/



function processAudio(sharedDir, scriptName, ...args){
  return new Promise((resolve, reject) => {
    // console.log('Step 1: call processAudio')
    let cmd = `docker run --rm -v ${sharedDir}:/data dockerffmpeg ${scriptName}.sh ${args.join(' ')}`
    // console.log('Exec: '+ cmd)

    // A hack to resolve when the script is done
    chokidar.watch(sharedDir+'taskcomplete.marker').on('add', () => {
      //  console.log('Step 3: file resolver -- marker file found')
      return resolve(true)
    })

    //call the docker script
    exec(cmd, {maxBuffer: 1024 * 5000}, (error, stdout, stderr) => { // never fires
      //  console.log('Step 3: docker completed, this is not usually being called')
      if (error) {
        return reject(error);
      }
      return resolve(true);
    })
  })
}
