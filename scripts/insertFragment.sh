#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // insert one file into another, resolves to destFile
# insertFragment(srcFile, fragmentFile, position, [destFile])
# processAudio(tmpDir, 'insertFragment', fileName(tmpSrc), fileName(tmpFrag), fileName(tmpDest), position)

# tmpDir: contains source audio files
# fileName(tmpSrc): source audio file stored in the tmpDir
# fileName(tmpFrag): source audio file for fragment to be inserted, also in tmpDir
# fileName(tmpDest): expected target file name, to be placed in tmpDir

ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
