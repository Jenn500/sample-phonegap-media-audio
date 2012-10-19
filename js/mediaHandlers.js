/*
* Copyright (c) 2012, Intel Corporation
* File revision: 04 October 2012
* Please see http://software.intel.com/html5/license/samples 
* and the included README.md file for license terms and conditions.
*/

var my_audio = null;
var progressTimmer = null;
var createdStatus = false;
var recTime = 0;

// for recording: do not specify any directory
var mediaFileFullName = null; 
var mediaRecFile = "myRecording100.wav";
var checkFileOnly = false;
var mediaFileExist = false;
var myMediaState = {start: 1, 
					recording: 2, 
					finishRec: 3, 
					playback: 4, 
					paused: 5,
					stopped: 6 };

/* console.log et al are not always available in Firefox. This silences it and prevents a JS error. */
if(typeof console === "undefined") {
    console = { log: function() { } };
}   



function onOK_GetFile(fileEntry) {
	console.log("***test: File " + mediaRecFile + " at " + fileEntry.fullPath);
	
    // save the full file name
    mediaFileFullName = fileEntry.fullPath;
    if (phoneCheck.ios)
        mediaRecFile = mediaFileFullName;

	if (checkFileOnly == true) { // check if file exist at app launch. 
		mediaFileExist = true;
        
	    setButtonState(myMediaState.finishRec);
	} 
	else { // record on iOS
        
		// create media object using full media file name 
		my_audio = new Media(mediaRecFile, onMediaCallSuccess, onMediaCallError);

		// specific for iOS device: recording start here in call-back function
		recordNow();
	}
}

function onSuccessFileSystem(fileSystem) {
	console.log("***test: fileSystem.root.name: " + fileSystem.root.name);

    if (checkFileOnly == true)
    	fileSystem.root.getFile(mediaRecFile, { create: false, exclusive: false }, onOK_GetFile, null);
    else
    	fileSystem.root.getFile(mediaRecFile, { create: true, exclusive: false }, onOK_GetFile, null);
    
}
function checkMediaRecFileExist() {
	checkFileOnly = true;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccessFileSystem, null);
}

function recordNow() {
	if (my_audio) {
		my_audio.startRecord();
		document.getElementById('RecStatusID').innerHTML = "Status: recording";
		console.log("***test:  recording started: in startRecording()***");
	}
	else
		console.log("***test:  my_audio==null: in startRecording()***");

	// reset the recTime every time when recording
	recTime = 0;

	// Stop recording after 10 sec
	progressTimmer = setInterval(function() {
		recTime = recTime + 1;
		setAudioPosition('media_rec_pos', recTime + " sec");
		if (recTime >= 10)
			stopRecording();
		console.log("***test: interval-func()***");
	}, 1000);
}

// Record audio    
//     
function startRecording() {
    // change buttons state
    setButtonState(myMediaState.recording);

    // create media object - overwrite existing recording
    if (my_audio)
    	my_audio.release();

    if (phoneCheck.android) {
    	my_audio = new Media(mediaRecFile, onMediaCallSuccess, onMediaCallError);
    	console.log("***test: new Media() for android ***");

    	recordNow();
    }
    else if (phoneCheck.windows7) {
    	my_audio = new Media(mediaRecFile, onMediaCallSuccess, onMediaCallError);
    	console.log("***test: new Media() for Windows7 ***");

    	recordNow();
    }
    else if (phoneCheck.ios) {
    	//first create the file
    	checkFileOnly = false;
    	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccessFileSystem, function() {
    		console.log("***test: failed in creating media file in requestFileSystem");
    	});

    	console.log("***test: new Media() for ios***");
    }
    
}

// Stop recording
function stopRecording() {
    // enable "record" button but disable "stop"
    setButtonState(myMediaState.finishRec);

    if (my_audio) 
		my_audio.stopRecord(); // the file should be moved to "/sdcard/"+mediaRecFile

    clearProgressTimmer();

    document.getElementById('RecStatusID').innerHTML = "Status: stopped record";
    console.log("***test: recording stopped***");
}

// Play audio        
//
function playMusic() {
	if (my_audio === null) { // play existing media recorded from previous session
		
		// the existing medail should be on /sdcard/ for android. 
        if (phoneCheck.android) {
        	my_audio = new Media("/sdcard/" + mediaRecFile, onMediaCallSuccess, onMediaCallError);

            console.log("***test:  Open file:" + mediaRecFile);
        } else if (phoneCheck.windows7) // windows 7.1 phone
            my_audio = new Media(mediaRecFile, onMediaCallSuccess, onMediaCallError);
        else if (phoneCheck.ios) {
            my_audio = new Media(mediaFileFullName, onMediaCallSuccess, onMediaCallError);
        }
    }

    // Play audio
    if (my_audio) {
        my_audio.play();
        document.getElementById('PlayStatusID').innerHTML = "Status: playing...";

        setButtonState(myMediaState.playback);

        // Update media position every second
        clearProgressTimmer();
        progressTimmer = setInterval(function () {
            // get my_audio position
            my_audio.getCurrentPosition(
            // success callback
            function (position) {
                if (position >= 0)
                    setAudioPosition('media_pos', (position) + " sec");
                else {
                    // reached end of media: same as clicked stop-music 
                    clearProgressTimmer();
                    setAudioPosition('media_pos', "0 sec");
                    document.getElementById('PlayStatusID').innerHTML = "Status: stopped";
                    setButtonState(myMediaState.stopped);
                }
            },
            // error callback
            function (e) {
                document.getElementById('PlayStatusID').innerHTML = "Status: Error on getting position - " + e;
                setAudioPosition("Error: " + e);
            });
        }, 1000);
    }
}
// Pause audio
//
function pauseMusic() {
    if (my_audio) {
        my_audio.pause();
        document.getElementById('PlayStatusID').innerHTML = "Status: paused";

        clearProgressTimmer();
        setButtonState(myMediaState.paused);
    }
}
// Stop audio        
//         
function stopMusic() {
    if (my_audio) {
        setAudioPosition('media_pos', "0 sec");
        setButtonState(myMediaState.stopped);

        my_audio.stop();

        // should not be necessary, but it is needed in order to play again. 
        my_audio.release()
        my_audio = null; 

        clearProgressTimmer();
        document.getElementById('PlayStatusID').innerHTML = "Status: stopped";
    }
}
function clearProgressTimmer() {
    if (progressTimmer) {
        clearInterval(progressTimmer);
        progressTimmer = null;
    } 
}
// Media() success callback        
function onMediaCallSuccess() {
    createdStatus = true;
    console.log("***test: new Media() succeeded ***");
}
// Media() error callback        
function onMediaCallError(error) {
	console.log("***test: new Media() failed ***");
}
// Set audio position        
//
function setAudioPosition(audioPosID, position) {
    document.getElementById(audioPosID).innerHTML = "Audio position: "+position;
}

// only "Record" button is enabled at init state
function setButtonState(curState)
{
    var id_disabled_map = {"startRecID":false, 
                             "stopRecID":true, 
                             "startPlayID":true, 
                             "pausePlayID":true, 
                             "stopPlayID":true};

    if (curState == myMediaState.start) // only "record" is enabled
    {
        console.log("***test:  start state #####");
    }                         
    else if (curState == myMediaState.recording) // only "stoprec" is enabled
    {
        console.log("***test:  recording state #####");
        id_disabled_map["startRecID"] = true;
        id_disabled_map["stopRecID"] = false;
    }
    else if ((curState == myMediaState.finishRec) ||
        (curState == myMediaState.stopped)) // only "record", "play" are enabled
    {
        console.log("***test:  finishing/stopped state #####");
        id_disabled_map["startPlayID"] = false;
    }
    else if (curState == myMediaState.playback)  // only "pause", "stop" are enabled
    {
        console.log("***test:  playback state #####");
        id_disabled_map["startRecID"] = true;
        id_disabled_map["startPlayID"] = true;
    }
    else if (curState == myMediaState.paused)  // only "play", "record" & "stop" are enabled
    {
        console.log("***test:  paused state #####");
        id_disabled_map["startPlayID"] = false;
        id_disabled_map["stopPlayID"] = false;
    }
    else
    {
        console.log("***  unknown media state");
    }

    var keys = Object.keys(id_disabled_map); //the list of ids: ["startRecID", "stopRecID",...]
    keys.forEach(function(id){ document.getElementById(id).disabled = id_disabled_map[id];});
    return(id_disabled_map); 
}
