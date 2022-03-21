#!/bin/bash
#

# Make an ffprobe call with specified params.
#
# $1 inputFile: file path.
# $2 inputParams: string with command details.

echo "ffprobe -i \"$1\" $2"
if [[ $2 ]]
then
ffprobe -i "$1" $2
else
ffprobe $1
fi


# mark this task complete
#touch "/data/taskcomplete.marker"
