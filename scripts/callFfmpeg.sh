#!/bin/bash
#

# Make an ffmpeg call with specified params.
#
# $1 inputParams: string with command details.


ffmpeg $1


# mark this task complete
touch "/data/taskcomplete.marker"

