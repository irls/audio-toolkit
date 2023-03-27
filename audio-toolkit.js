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


let logger = false;
//let writeStream = false;



class AudioToolkit {
  constructor(logPath) {
    // in case we need some instantiated object data
    if (logPath) {
      logger = logPath;
      fs.existsSync(logger);
      //writeStream = fs.createWriteStream(logger);
    }
  }

  // resolves to an array of converted files
  // implemented with docker script convertFormat.sh
  convertFormat(srcFiles, toFormat) {
    // console.log('convertFormat', srcFiles, toFormat)
    if (!srcFiles || !toFormat)
     throw "ConvertFormat warning: srcFile & toFormat are required fields"
    if (!toFormat) toFormat = 'flac' // default format
    const tmpDir = tempy.directory() + '/'
    let fileCopyTasks = srcFiles.map((src, i) => {
      fs.copy(src, tmpDir + i + path.extname(src))
    } )
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
  
  // convert file format with convertFormatSingle.sh
  convertFormatSingle(srcFile, destFile, command = '-ar 44100') {
    // console.log('convertFormat', srcFiles, toFormat)
    if (!srcFile || !destFile) {
      throw "ConvertFormat warning: srcFile & toFormat are required fields"
    }
    if (!fs.existsSync(destFile)) {// if file does not exists - create it with current user's privileges
      fs.openSync(destFile, 'w');
    }
    return processAudio([
      {
        src: path.dirname(srcFile),
        target: '/data'
      }
    ],'convertFormatSingle', `"${path.basename(srcFile)}"`, `"${path.basename(destFile)}"`, `"${command}"`)
      .then(() => {
        return destFile;
      })
      .catch(err => {
        console.log(`convertFormatSingle err`, err.message, err.stack);
        return Promise.reject(err);
      });
  }

  // joins files, resolves to destFile
  // implemented with docker script mergeFiles.sh
  mergeFiles(srcFiles, destFile, useProtocol = false) {
    //console.log('mergefiles: ', srcFiles, destFile)
    if (!srcFiles) throw "MergeFiles warning: srcFile is a required field"
    let ext = path.extname(srcFiles[0]).split('.')[1]
    ////console.log('ext: ', ext) //
    if (!destFile) destFile = tempy.file({ extension: ext })
    //console.log('srcfiles[0], destFile, ext: ', srcFiles[0], destFile, ext)
    const tmpDir = tempy.directory()  + '/'
    const inputDir = 'input/'
    const outputFile = 'output.' + ext
    let fileCopyTasks = srcFiles.map((src, i) => fs.copy(src, tmpDir + inputDir + ('0'.repeat(11 - ('' + i).length)) + i + '.' + ext) )//
    let processTask = () => processAudio(tmpDir,useProtocol?'mergeFilesProtocol':'mergeFiles', inputDir, outputFile)
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
  deleteSection(srcFile, fromPos, toPos, destFile, getInfo = false) {
    if (!srcFile||typeof fromPos === 'undefined' ||!toPos)
     throw "DeleteSection warning: srcFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile).split('.')[1]})
    const tmpDir = tempy.directory() + '/'
    const inputFile = 'input'+ path.extname(srcFile)
    const outputFile = 'output'+ path.extname(srcFile)
    const processAudioTask = processAudio(tmpDir, 'deleteSection',
      inputFile, outputFile, parseFloat(fromPos / 1000).toFixed(3), parseFloat(toPos / 1000).toFixed(3), getInfo )
    const copyFileTask = () => fs.copy(srcFile, tmpDir + inputFile)

    return copyFileTask()
      .then( () => processAudioTask )
      .then( () =>  fs.copy(tmpDir + outputFile, destFile) )
      .then( () => {
        let result = {
          destFile: destFile,
          inputInfo: {},
          outputInfo: {}
        }
        if (getInfo) {
          let dataOutput = fs.readFileSync(`${tmpDir}/out_data`).toString().trim();
          let dataInput = fs.readFileSync(`${tmpDir}/in_data`).toString().trim();
          //console.log(data)
          result.outputInfo.duration = dataOutput.replace(/.*?Duration:\s([0-9.:]+?)\,.*/ig, '$1');
          result.outputInfo.bitrate = dataOutput.replace(/.*?bitrate:\s(.*?)\skb\/s.*/ig, '$1');
          result.outputInfo.duration_ms = this.time2ms(result.outputInfo.duration);
          
          result.inputInfo.duration = dataInput.replace(/.*?Duration:\s([0-9.:]+?)\,.*/ig, '$1');
          result.inputInfo.bitrate = dataInput.replace(/.*?bitrate:\s(.*?)\skb\/s.*/ig, '$1');
          result.inputInfo.duration_ms = this.time2ms(result.inputInfo.duration);
          this._removeDirRecursive(tmpDir);
          return Promise.resolve(result);
        } else {
          this._removeDirRecursive(tmpDir);
          return Promise.resolve(destFile);
        }
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
  
  deleteSectionAndConvert(srcFile, fromPos, toPos, destFile, getInfo = false) {
    if (!srcFile||typeof fromPos === 'undefined' ||!toPos)
     throw "DeleteSection warning: srcFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile).split('.')[1]})
    const tmpDir = tempy.directory() + '/'
    const inputFile = 'input'+ path.extname(srcFile)
    const outputFile = 'output'+ path.extname(destFile)
    const processAudioTask = processAudio(tmpDir, 'deleteSectionAndConvert',
      inputFile, outputFile, parseFloat(fromPos / 1000).toFixed(3), parseFloat(toPos / 1000).toFixed(3), getInfo )
    const copyFileTask = () => fs.copy(srcFile, tmpDir + inputFile)

    return copyFileTask()
      .then( () => processAudioTask )
      .then( () =>  fs.copy(tmpDir + outputFile, destFile) )
      .then( () => {
        let result = {
          destFile: destFile,
          inputInfo: {},
          outputInfo: {}
        }
        if (getInfo) {
          let dataOutput = fs.readFileSync(`${tmpDir}/out_data`).toString().trim();
          let dataInput = fs.readFileSync(`${tmpDir}/in_data`).toString().trim();
          //console.log(data)
          result.outputInfo.duration = dataOutput.replace(/.*?Duration:\s([0-9.:]+?)\,.*/ig, '$1');
          result.outputInfo.bitrate = dataOutput.replace(/.*?bitrate:\s(.*?)\skb\/s.*/ig, '$1');
          result.outputInfo.duration_ms = this.time2ms(result.outputInfo.duration);
          
          result.inputInfo.duration = dataInput.replace(/.*?Duration:\s([0-9.:]+?)\,.*/ig, '$1');
          result.inputInfo.bitrate = dataInput.replace(/.*?bitrate:\s(.*?)\skb\/s.*/ig, '$1');
          result.inputInfo.duration_ms = this.time2ms(result.inputInfo.duration);
        }
        this._removeDirRecursive(tmpDir);
        return Promise.resolve(result);
      } );
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
    //const inputFile = 'input'+ path.extname(srcFile)
    fs.ensureDirSync(tmpDir);
    const outputFile = 'output.json'
    const aud = this
    //return fs.copy(srcFile, tmpDir + inputFile)
      //.then(
    return processAudio([
          {
            src: tmpDir,
            target: '/data'
          },
          {
            src: path.dirname(srcFile),
            target: '/audio'
          }
        ],'getMetaData', `"${path.basename(srcFile)}"`, outputFile)
      .then(() => {
        let data = fs.readFileSync(tmpDir + outputFile);
        let result = {
          duration: '',
          bitrate: '',
          duration_ms: null,
          stereo: false, 
          mono: false, 
          streamInfo: ''
        };
        data = data.toString().trim()
        //console.log(data)
        let match;
        if ((match = /.*?Duration:\s([0-9.:]+?)\,.*/igm.exec(data))) {
          if (match && match[1]) {
            result.duration = match[1];
            result.duration_ms = aud.time2ms(result.duration);
          }
        }
        if ((match = /.*?bitrate:\s(.*?)\skb\/s.*/igm.exec(data))) {
          if (match[1]) {
            result.bitrate = match[1];
          }
        }
        if ((match = /Stream #0:0.*?Audio:(.*)$/img.exec(data))) {
          result.streamInfo = match[0];
          if (match[1] && match[1].indexOf('stereo') !== -1 && match[1].indexOf('mono') === -1) {
            result.stereo = true;
          } else {
            result.mono = true;
          }
        }
        aud._removeDirRecursive(tmpDir);
        return Promise.resolve(result);
      })
  }

  // normalize volume levels
  // implemented with docker script normalizeLevels.sh
  // options not yet implemented
  normalizeLevels(srcFile, options = [{k: 'I', v: -25}, {k: 'TP', v: -1}, {k: 'LRA', v: 11}], destFile = false) {
    // TODO: implement some options
    if (!srcFile) {
      return Promise.reject(new Error("NormalizeLevels warning: srcFile is a required field"));
    }
    const tmpDir = tempy.directory()  + '/';
    const inputFile = 'input'+ path.extname(srcFile);
    const outputFile = 'output'+ path.extname(srcFile);
    let  params_list = '';
    options.forEach(opt => {
      params_list+=`${opt.k}=${opt.v}:`;
    });
    params_list = params_list.replace(/\:$/, '');
    fs.copySync(srcFile, tmpDir + inputFile);
    return processAudio(tmpDir, 'normalizeLevels',  inputFile, params_list, outputFile)
      .then(() => {
        if (destFile) {
          fs.copySync(tmpDir + outputFile, destFile);
          return Promise.resolve(destFile);
        }
        return Promise.resolve(tmpDir + outputFile);
      });
  }
  
  detectLevels(srcFile, options = [{k: 'I', v: -25}, {k: 'TP', v: -1}, {k: 'LRA', v: 11}]) {
    if (!srcFile) {
      return Promise.reject(new Error("Source file not specified"));
    }
    const tmpDir = tempy.directory()  + '/';
    const inputFile = 'input'+ path.extname(srcFile);
    let  params_list = '';
    options.forEach(opt => {
      params_list+=`${opt.k}=${opt.v}:`;
    });
    params_list = params_list.replace(/\:$/, '');
    fs.copySync(srcFile, tmpDir + inputFile);
    return processAudio(tmpDir, 'detectLevels', inputFile, params_list)
      .then(() => {
        return fs.readFile(`${tmpDir}levels`);
      })
      .then((data) => {
        let result = {};
        data = data.toString().trim();
        let parseRegexp = /Parsed.*?(\{[^\}]+\})/gmis;
        let info = parseRegexp.exec(data);
        if (info && info[1]) {
          try {
            result = JSON.parse(info[1]);
          } catch (e) {
            return Promise.resolve({});
          }
        }
        this._removeParentDir(tmpDir + inputFile);
        return Promise.resolve(result);
      });
  }
  
  normalizeCompand(srcFile, destFile, points = '', gain = false) {
    if (!srcFile) {
      return Promise.reject(new Error('File not specified'));
    }
    let dir = tempy.directory() + '/';
    let ext = path.extname(srcFile);
    let source = `source${ext}`;
    let dest = `dest${ext}`;
    fs.copySync(srcFile, dir + source);
    if (!points) {
      points = '-60/-900|-30/-20|-20/-9|0/-7|20/-3';
    }
    if (gain === false) {
      gain = 0;
    }
    return processAudio(dir, 'normalizeCompand', source, `"${points}"`, gain, dest)
      .then(() => {
        if (destFile) {
          fs.copySync(dir + dest, destFile);
          this._removeParentDir(dir + source);
          return Promise.resolve(destFile);
        } else {
          return Promise.resolve(dir + dest);
        }
      })
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
    if (!srcFile||typeof start === 'undefined'||(end && start>end))
      throw "getInterval warning: srcFile & start position are required fields, start should be less than end"
    let ext = path.extname(srcFile).split('.')[1]
    let aud = this
    start = parseFloat(start);
    end = end ? parseFloat(end) - start : '';
    const tmpDir = tempy.directory()  + '/'
    //const inputFile = 'input.'+ ext
    const outputFile = 'output.'+ ext
    //const inputCopyTask = fs.copy(srcFile, tmpDir + inputFile);// copy input file to temp directory
    //return Promise.all([inputCopyTask])
      //.then(() => {
      let srcDir = srcFile.split('/');
      let inputFile = 'input/' + srcDir.pop();
      srcDir = srcDir.join('/') + '/';
      let mntDir = [
        {
          src: srcDir,
          target: '/data/input'
        },
        {
          src: tmpDir,
          target: '/data'
        }
      ];
        return processAudio(mntDir,'getInterval', `"${inputFile}"`, outputFile, start, end)
          .then(() => {
            return fs.copy(tmpDir+outputFile, dest)// copy result file to destination directory
              .then(() => {
                fs.removeSync(tmpDir.replace(/\/$/, ''));// remove temporary directory
                return Promise.resolve(dest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          })
          .catch(err => {
            return Promise.reject(err);
          });
      //})
      //.catch(err => {
        //return Promise.reject(err);
      //});
  }
  
  detectSilence(source, db = null, length = null, keep_empty = false) {
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
    return this._copyFile(source, tmpDir + inputFile)
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
              } else if (keep_empty) {
                result.push({
                  start: parseFloat(match_start[1])
                })
              }
            }
          }
          aud._removeDirRecursive(tmpDir);
          return Promise.resolve(result)
        })
      )
  }
  
  forceMono(file, target) {
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input'+ path.extname(file)
    const outputFile = 'output.json'
    const targetFile = 'output.' + file.split('.').pop();
    let log = [];
    return fs.copy(file, tmpDir + inputFile)
      .then(() => {
        return this.getMetaData(tmpDir + inputFile)
      }).then((info) => {
        log.push(info.streamInfo);
        if (info.stereo) {
          log.push('STEREO');
          return Promise.all([
            this.detectChannelSilence(tmpDir + inputFile, 0, '-50dB', 0.1),
            this.detectChannelSilence(tmpDir + inputFile, 1, '-50dB', 0.1)
          ])
            .then(silences => {
              let [silencesLeft, silencesRight] = silences;
              let channel = null;
              if (silencesLeft && silencesLeft.length === 1) {
                if (typeof silencesLeft[0].start !== 'undefined') {
                  if (typeof silencesLeft[0].end === 'undefined') {
                    channel = 0;
                  } else {
                    let pauseDuration = parseInt((silencesLeft[0].end - silencesLeft[0].start) * 1000);// in milliseconds
                    if (Math.abs(pauseDuration - info.duration_ms) < 10) {
                      channel = 0;
                    }
                  }
                }
              }
              if (channel === null && silencesRight && silencesRight.length === 1) {
                if (typeof silencesRight[0].start !== 'undefined') {
                  if (typeof silencesRight[0].end === 'undefined') {
                    channel = 0;
                  } else {
                    let pauseDuration = parseInt((silencesRight[0].end - silencesRight[0].start) * 1000);// in milliseconds
                    if (Math.abs(pauseDuration - info.duration_ms) < 10) {
                      channel = 1;
                    }
                  }
                }
              }
              log.push(`DETECTED CHANNEL ${channel}`)
              if (channel !== null) {
                fs.removeSync(tmpDir + 'taskcomplete.marker');
                return processAudio(tmpDir,'convertMono', inputFile, targetFile, channel === 0 ? 1 : 0)
                  .then(() => {
                    return this._copyFile(tmpDir + targetFile, target)
                      .then(() => {
                        this._removeDirRecursive(tmpDir);
                        log.push(`PROCESSED ${target}`)
                        return Promise.resolve(log);
                      });
                  })
              } else {
                this._removeDirRecursive(tmpDir);
                return Promise.resolve(log);
              }
            })
        }
        log.push('MONO')
        this._removeDirRecursive(tmpDir);
        return Promise.resolve(log);
      })
  }
  
  detectChannelSilence(file, channel, level, length) {
    const tmpDir = tempy.directory()  + '/'
    const inputFile = 'input'+ path.extname(file)
    const outputFile = 'output.json'
    return fs.copy(file, tmpDir + inputFile)
      .then(
        () => processAudio(tmpDir,'detectChannelSilence', inputFile, outputFile, level, length, channel)
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
              } else {
                result.push({
                  start: parseFloat(match_start[1])
                })
              }
            }
          }
          this._removeDirRecursive(tmpDir);
          return Promise.resolve(result);
        })
      )
  }
  
  getIntervals(inputFile, positions, outputFile) {
    //console.log(`getIntervals ${inputFile}`)
    const tmpDir = tempy.directory()  + '/'
    const sourceFile = 'input'+ path.extname(inputFile)
    //const outputFile = 'output.json'
    const outputDir = `${tmpDir}output`;
    positions.forEach(s => {
      s[0] = parseFloat(s[0] / 1000).toFixed(3);
      s[1] = parseFloat(s[1] / 1000).toFixed(3);
    });
    let positionsString = '';
    positions.forEach(p => {
      positionsString+=`${p}|`;
    });
    positionsString = positionsString.replace(/\|$/, '');
    fs.mkdirSync(outputDir)
    //console.log(`copySync ${inputFile}, ${tmpDir + sourceFile}`)
    fs.copySync(inputFile, tmpDir + sourceFile);
    return processAudio(tmpDir, 'getIntervals', sourceFile, `"${positionsString}"`)
      .then(() => {
        let files = fs.readdirSync(`${outputDir}`).filter(file => {
          //console.log('CHECK FILE', file);
          return file.match(/(flac|m4a)$/ig);
        });
        outputFile.forEach((of, i) => {
          Object.keys(of).forEach(ext => {
            let _f = files.find(f => {
              return f === `${i}.${ext}`;
            });
            if (_f) {
              fs.moveSync(`${outputDir}/${_f}`, of[ext], {overwrite: true});
            }
          })
        });
        this._removeDirRecursive(tmpDir);
        return Promise.resolve(files);
      });
  }
  
  volumedetect(file) {
    
    const tmpDir = tempy.directory()  + '/';
    return processAudio([
      {
        src: tmpDir,
        target: '/data'
      },
      {
        src: path.dirname(file),
        target: '/data/audio'
      }
    ], 'volumedetect', path.basename(file))
      .then(() => {
        //console.log('readFile', `${tmpDir}output`)
        return fs.readFile(`${tmpDir}output`).then((data) => {
          //console.log(data);
          let result = {}
          data = data.toString().trim();
          //console.log(data)
          ['n_samples', 'mean_volume', 'max_volume', 'histogram_.*?'].forEach(field => {
            let match = null;
            let rg = new RegExp(`(${field}): (.*)`, 'img');
            while ((match = rg.exec(data))) {
              result[match[1]] = parseInt(match[2]);
            }
          });
          this._removeDirRecursive(tmpDir);
          return Promise.resolve(result);
        })
      })
  }
  
  convertAndNormalize(file, output, normalization = 'f=150:c=1:b=1', ba = '40k', ar = '22050', noiseRemoval = true) {
    const tmpDir = tempy.directory()  + '/';
    return processAudio([
      {
        src: tmpDir,
        target: '/data'
      },
      {
        src: path.dirname(file),
        target: '/data/audio'
      }
    ], 'convertAndNormalize', path.basename(file), output, normalization, ba, ar, noiseRemoval)
      .then(() => {
        this._removeDirRecursive(tmpDir);
        return Promise.resolve();
      })
      .catch(err => {
        this._removeDirRecursive(tmpDir);
        return Promise.reject(err);
      })
  }
  
  /*compressAndNormalize(file, output) {
    const tmpDir = tempy.directory()  + '/';
    return processAudio([
      {
        src: tmpDir,
        target: '/data'
      },
      {
        src: path.dirname(file),
        target: '/data/audio'
      }
    ], 'convertAndNormalize', path.basename(file), output)
      .then(() => {
        this._removeDirRecursive(tmpDir);
        return Promise.resolve();
      })
      .catch(err => {
        this._removeDirRecursive(tmpDir);
        return Promise.reject(err);
      })
  }*/
  
  compressAndNormalize(file, output, normalization = 'f=150:c=1:b=1', ba = '40k', ar = '22050', noiseRemoval = true, volumeFilter = '') {
    const tmpDir = tempy.directory()  + '/';
    console.time('compressAndNormalize ' + file);
    //console.log(arguments);
    return processAudio([
      {
        src: tmpDir,
        target: '/data'
      },
      {
        src: path.dirname(file),
        target: '/data/audio'
      }
    ], 'compressAndNormalize', path.basename(file), output, `"${normalization}"`, `"${ba}"`, `"${ar}"`, `"${noiseRemoval}"`, `"${volumeFilter}"`)
      .then(() => {
        console.timeEnd('compressAndNormalize ' + file);
        this._removeDirRecursive(tmpDir);
        return Promise.resolve();
      })
      .catch(err => {
        this._removeDirRecursive(tmpDir);
        return Promise.reject(err);
      })
  }
  
  generateSilences(start, step, end, extension = 'flac') {
    const tmpDir = tempy.directory()  + '/';
    return processAudio([
      {
        src: tmpDir,
        target: '/data'
      }
    ], 'generateSilences', start, step, end, extension)
      .then(() => {
        let files = [];
        fs.readdirSync(tmpDir).forEach(f => {
          files.push(`${tmpDir}${f}`);
        });
        return Promise.resolve(files);
      });
  }
  
  removeNoiseAnlmdn(source, target, command = "") {
    return processAudio([
      {
        src: path.dirname(source),
        target: '/data'
      }
    ], 'removeNoiseAnlmdn', path.basename(source), path.basename(target), `"${command}"`)
      .then(() => {
        return Promise.resolve(target);
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }
  
  compressLibfdk(source, target, command = "") {
    return processAudio([
      {
        src: path.dirname(source),
        target: '/data'
      }
    ], 'compressLibfdk', path.basename(source), path.basename(target), `"${command}"`)
      .then(() => {
        return Promise.resolve(target);
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }
  
  removeNoiseAfftdn(source, target, command = "", detectedSilence = []) {
    let positionsStart = '';
    let positionsEnd = '';
    if (detectedSilence) {
      positionsStart = detectedSilence[0].start;
      positionsEnd = detectedSilence[0].end;
    }
    return processAudio([
      {
        src: path.dirname(source),
        target: '/data'
      }
    ], 'removeNoiseAfftdn', path.basename(source), path.basename(target), positionsStart, positionsEnd, `"${command}"`)
      .then(() => {
        return Promise.resolve();
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }

  /**
   * Get audio metadata like genre, atrist, album, etc.
   * @param String file - path to audio file
   * @returns Object
   */
  getAudioMeta(file) {
    let sourceDir = path.dirname(file);
    let infoFilename = `/_${path.basename(file)}_metadata_${Date.now()}`;
    let targetPath = `${sourceDir}/${infoFilename}`;
    return processAudio([
      {
        src: sourceDir, 
        target: '/data'
      }
    ], 'getAudioMeta', `"${path.basename(file)}"`, `"${infoFilename}"`)
      .then(() => {
        if (fs.existsSync(targetPath)) {
          let data = fs.readFileSync(targetPath);
          let regExp = new RegExp('^(\\w+)=([\\s\\S]*?)$', 'img');
          let match = '';
          let response = {};
          while ((match = regExp.exec(data))) {
            if (match && match[1]) {
              response[match[1]] = match[2];
            }
          }
          fs.unlinkSync(targetPath);
          return response;
        }
        return Promise.reject(new Error('File not found'));
      })
      .catch(err => {
        return {};
      });
  }
  
  setAudioMeta(file, metadata) {
    let sourceDir = path.dirname(file);
    let sourceFilename = path.basename(file);
    let infoFilename = `_${sourceFilename}_metadata_${Date.now()}`;
    let targetFilename = sourceFilename + '_metadata_set' + path.extname(file);
    let data = ';FFMETADATA1';
    Object.keys(metadata).forEach(k => {
      data+=`
${k}=${metadata[k]}`;
    });
    fs.outputFileSync(sourceDir + '/' + infoFilename, data);
    return processAudio([
      {
        src: sourceDir, 
        target: '/data'
      }
    ], 'setAudioMeta', `"${sourceFilename}"`, `"${infoFilename}"`, `"${targetFilename}"`)
      .then(() => {
        fs.moveSync(sourceDir + '/' + targetFilename, sourceDir + '/' + sourceFilename, {overwrite: true});
        fs.unlinkSync(sourceDir + '/' + infoFilename);
        return {};
      })
      .catch(err => {
        return Promise.reject(err);
      });
  }
  
  fadeInFadeOutPercent(inputFile, outputFile, start, end, length, percent) {
    let source = path.basename(inputFile);
    let sourceDir = path.dirname(inputFile);
    let target = path.basename(outputFile);
    
    return processAudio([
      {
        src: sourceDir,
        target: '/data'
      }
    ], 'fadeInFadeOutPercent', `"/data/${source}"`, `"/data/${target}"`, start, end, length, percent);
  }
  
  getStreams(srcFile) {
    if (!srcFile) {
      return Promise.reject("AudioToolkit getStreams: no file specified");
    }
    const tmpDir = tempy.directory()  + '/'
    //const inputFile = 'input'+ path.extname(srcFile)
    fs.ensureDirSync(tmpDir);
    const outputFile = 'output.json'
    return processAudio([
          {
            src: tmpDir,
            target: '/data'
          },
          {
            src: path.dirname(srcFile),
            target: '/audio'
          }
        ],'getMetaData', `"${path.basename(srcFile)}"`, outputFile)
      .then(() => {
        let data = fs.readFileSync(tmpDir + outputFile);
        let result = [];
        data = data.toString().trim();
        //console.log(data)
        let streamsRegex = /^\s*stream\s*\#(\d+\:\d+)\:([^:]+)\:(.*)/gmi;
        let match;
        while ((match = streamsRegex.exec(data))) {
          result.push({
            number: match[1].trim(),
            type: match[2].trim().toLowerCase(),
            info: match[3].trim(),
          });
        }
        this._removeDirRecursive(tmpDir);
        return Promise.resolve(result);
      })
      .catch(err => {
        return Promise.resolve();
      });
  }
  
  clearVideoStream(srcFile) {
    if (!srcFile) {
      return Promise.reject("AudioToolkit clearVideoStream: no file specified");
    }
    return this.getStreams(srcFile)
      .then(streams => {
        let hasVideo = streams.find(stream => {
          return stream.type === 'video';
        });
        if (hasVideo) {
          let outputFile = srcFile + '_audio' + path.extname(srcFile);
          return processAudio([
                {
                  src: path.dirname(srcFile),
                  target: '/data'
                }
              ],'clearVideoStream', `"${path.basename(srcFile)}"`, `"${path.basename(outputFile)}"`)
            .then(() => {
              fs.moveSync(outputFile, srcFile, {overwrite: true});
              return Promise.resolve(hasVideo);
            })
          }
          return {};
      })
      .catch(err => {
        return Promise.resolve();
      });
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
    return (Number(h)*60*60*1000) + (Number(m)*60*1000) + (Number(s)*1000) + Number(ms) * 10
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
  
  _copyFile(fromPath, toPath) {
    return new Promise(function(resolve, reject) {
      if (fromPath === toPath) {
        resolve();
      } else {
        let toDir = toPath.split('/');
        toDir.pop();
        toDir = toDir.join('/');
        fs.ensureDirSync(toDir);
        var readStream = fs.createReadStream(fromPath);
        var writeStream = fs.createWriteStream(toPath);
        readStream.on('open', function () {
          readStream.pipe(writeStream);
        });
        writeStream.on('finish', () => {
          resolve();
        });
      }
    });
  }

}

module.exports = AudioToolkit

/*
   Internal, not exported
*/



function processAudio(sharedDir, scriptName, ...args){
  return new Promise((resolve, reject) => {
    // console.log('Step 1: call processAudio')
    let cmd = `docker run --rm `;
    if (Array.isArray(sharedDir)) {
      sharedDir.forEach(sd => {
        cmd+=`-v "${sd.src}":${sd.target} `;
      });
    } else {
      cmd+=`-v "${sharedDir}":/data `;
    }
    cmd+= `dockerffmpeg ${scriptName}.sh ${args.join(' ')}`
    // console.log('Exec: '+ cmd)

    // A hack to resolve when the script is done
    const watcher = chokidar.watch(sharedDir+'taskcomplete.marker');
    
    let scriptTime = Date.now();
    let timeoutCheck = setTimeout(() => {// timeout for checking complete file, 60 minutes
      watcher.close();
      return reject(new Error('TIMEOUT'));
    }, 60 * 60 * 1000);
    
    watcher.on('add', () => {
      //  console.log('Step 3: file resolver -- marker file found')
      logRequest(scriptTime, sharedDir, scriptName, ...args);
      clearTimeout(timeoutCheck);
      watcher.close();
      return resolve(true)
    });

    //call the docker script
    exec(cmd, {maxBuffer: 1024 * 5000}, (error, stdout, stderr) => { // never fires
      //  console.log('Step 3: docker completed, this is not usually being called')
      logRequest(scriptTime, sharedDir, scriptName, ...args);
      if (error) {
        return reject(error);
      }
      return resolve(true);
    })
  })
}

function logRequest(startTime, sharedDir, scriptName, ...args) {
  
  let scriptTime = trackTimeDiff(startTime);
  if (logger) {
    let sourceFile = "";
    let dirs;
    if (Array.isArray(sharedDir)) {
      dirs = [];
      sharedDir.forEach(dir => {
        dirs.push(dir.src);
      });
    } else {
      dirs = [sharedDir];
    }
    dirs.forEach(dir => {
      args.forEach(arg => {
        if (fs.existsSync(dir + '/' + arg) && ['.wav', '.flac', '.m4a'].includes(path.extname(dir + '/' + arg))) {
          sourceFile = dir + '/' + arg;
        }
      });
    });
    let size = null;
    if (sourceFile) {
      let statFile = fs.statSync(sourceFile);
      size = parseFloat(parseFloat(statFile.size / 1024).toFixed(2)) + 'kB'
    }
    let dt = new Date();
    let stats = [
      `"[${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}]"`,
      `"${scriptName}"`,
      `"${scriptTime}"`,
      `"${size}"`,
      `"${sourceFile}"`
    ];
    args.forEach(arg => {
      stats.push(`"${(arg + "").replace(/\"/g, '')}"`);
    });
    fs.appendFileSync(logger, stats.join(',') + ";\n");
    //writeStream.write(stats.join(',') + ";\n");
  }
}

function trackTimeDiff(startTime) {
  let endTime = Date.now();
   let seconds = parseInt((endTime - startTime) / 1000);
   let minutes;
   let hours;
   if (seconds > 60) {
     minutes = parseInt(seconds / 60);
     seconds = seconds % 60;

   }
   if (minutes > 60) {
     hours = parseInt(minutes / 60);
     minutes = minutes % 60;
   }
   return (hours ? `${hours}h:` : '') + (typeof minutes === 'undefined' ? '' : `${minutes}m:`) + (`${seconds}s`);
}
