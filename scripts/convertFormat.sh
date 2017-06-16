#!/bin/bash

# #file type
# ft=$1

# if [ "$1" == "" ]; then
# 	ft='mp3'
# fi

# // resolves to an array of converted files
# convertFormat(srcFiles, destFormat)
# processAudio(tmpSrcDir, 'convertFormat', destFormat, tmpDestDir)

# tmpSrcDir: contains source audio files
# destFormat: destination format and file extensions
# tmpDestDir: empty dir for converted files


ffmpeg -f concat -safe 0 -i <(for f in /data/*.mp3; do echo "file '$f'"; done) -c copy /data/output.wav
