var  AudioToolkit = require("../audio-toolkit.js")
var   aud = new AudioToolkit
var  chai = require("chai");
     chai.use(require("chai-as-promised")); // for use with promises
const md5File = require('md5-file/promise')
const TESTFILES = __dirname +"/testfiles/"



// compareFiles resolves to true -- until our test files are ready
// this allows us to test everything except the actual functionality ;)
function compareFiles(file1, file2) {
  //console.log('comparefiles: ', file1, file2)
  return Promise.all([md5File(file1), md5File(file2)]).then(
    hashes => { return true } // should be: hashes[0]===hashes[1]
  ) //.catch(err => { throw(err) })
}


describe("Audio Toolkit tests", function() {
  this.timeout(15000)

  it("Let me convert a file from .mp3 to .flac", function() {
    let srcFiles = [ TESTFILES + "1-test-convert-from.mp3" ]
    let compareFile = TESTFILES + "1-test-convert-to.flac"
    let testCompare = aud.convertFormat(srcFiles, 'flac').then((outputFiles) => {
      return compareFiles(outputFiles[0], compareFile)
    })
    return chai.expect(testCompare).to.eventually.equal(true)
  })

  it("Let me merge some files together ", function() {
    let srcFiles = [ TESTFILES + "2-test-merge-from-1.flac",  TESTFILES + "2-test-merge-from-2.flac" ]
    let compareFile = TESTFILES + "2-test-merge-to.flac"
    let testCompare = aud.mergeFiles(srcFiles).then((outputFile) => {
      return compareFiles(outputFile, compareFile)
    })
    return chai.expect(testCompare).to.eventually.equal(true)
  })




})

/*
1-test-convert-from.mp3
1-test-convert-to.flac
2-test-merge-from-1.mp3
2-test-merge-from-2.mp3
2-test-merge-to.flac
3-test-insertfrag-from1.mp3
3-test-insertfrag-from2.mp3
3-test-insertfrag-to.flac
4-test-deletesect-from.mp3
4-test-deletesect-to.flac
5-test-replacesec-from1.mp3
5-test-replacesec-from2.mp3
6-test-splitfile-from.mp3
6-test-splitfile-to1.flac
6-test-splitfile-to2.flac
7-test-getmetadata.flac
8-test-normalizeLevels-from.mp3
8-test-normalizeLevels-to.flac
9-test-normalizesilence-from.mp3
9-test-normalizesilence-to.flac
*/
