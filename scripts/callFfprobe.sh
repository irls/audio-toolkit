#!/bin/bash
#

# Make an ffprobe call with specified params.
#
# $1 inputFile: file path.
# $2 inputParams: string with command details.

echo "ffprobe -i \"$1\" $2"
ffprobe -i "$1" $2


# mark this task complete
#touch "/data/taskcomplete.marker"
