#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // joins files, resolves to destFile
# mergeFiles(srcFiles, destFile)
# processAudio(tmpSrcDir, 'mergeFiles', tmpDestDir, fileName(tmpDestFile))

# tmpSrcDir: contains source audio files
# tmpDestDir: empty dir for merged file
# fileName(tmpDestFile): target file name in tmpDestDir

ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
