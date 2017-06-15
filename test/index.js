var  AudioToolkit = require("../audio-toolkit.js")
var   aud = new AudioToolkit
var  chai = require("chai");
     chai.use(require("chai-as-promised")); // for use with promises
const md5File = require('md5-file/promise')
const TESTFILES = __dirname +"/testfiles/"


function compareFiles(file1, file2) {
  let hash1, hash2
  return Promise.all(
    md5File(file1).then(hash => {file1=hash})
    md5File(file2).then(hash => {file2=hash})
  ).then(() => file1===file2 )
}


describe("Audio Toolkit tests", function() {
  it("1. Let me convert a file from .mp3 to .flac", function() {
    let srcFile = TESTFILES + "1-test-convert-from.mp3"
    let compareFile = TESTFILES + "1-test-convert-to.flac"
    let testCompare = aud.convertFormat([srcFiles], 'flac').then((outputFiles) => {
      return compareFiles(outputFiles[0], compareFile)
    })
    return chai.expect(testCompare).to.eventually.be(true)
  })

})
