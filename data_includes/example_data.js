var REPEATADVICE = false,
    ISLL = false,
    ISINS = true,
    ITEMID = 1,
    userID = 0; // For MTurk, dealt with at the end
/*var ISLL = Math.random()>0.5,
    ISINS = Math.random()>0.5,
    REPEATADVICE = Math.random()>0.5,
    ITEMID = 1+Math.floor(Math.random()*2),
    userID = 0; // For MTurk, dealt with at the end*/

var writtenOrAudioReplay = "Written";

var writtenOrAudioAdvice = "Audio";

var trimmedAudioRepetition = "trimmed"; // Set to "" (no text) for repetition audios with greetings


var Parameters = {},
    URLParameters = window.location.search.replace("?", "").split("&");

for (parameter in URLParameters) Parameters[URLParameters[parameter].split("=")[0]] = URLParameters[parameter].split("=")[1];

if (typeof Parameters.REPEATADVICE != "undefined") REPEATADVICE = (Parameters.REPEATADVICE == "true");
if (typeof Parameters.writtenOrAudioReplay != "undefined") writtenOrAudioReplay = Parameters.writtenOrAudioReplay;
if (typeof Parameters.writtenOrAudioAdvice != "undefined") writtenOrAudioAdvice = Parameters.writtenOrAudioAdvice;


if (!REPEATADVICE) writtenOrAudioReplay = "Written";


var startTime = Date.now();

//alert(ISLL);
//alert(ISINS);
//alert(REPEATADVICE);
//alert(ITEMID);

//var shuffleSequence = seq("Fifth16", "Sixth16", "FinalScreen");

// Why not just use "First16" and "Second16"? Aren't <Third, Fourth> and <Fifth, Sixth> the exact same pair? So that I know which block a token was played in for analysis later
var shuffleSequence = seq("Test", "Instructions", "Preload",
                          randomize("First16"),randomize("Second16"),
                          "ExpItem"+writtenOrAudioAdvice,randomize("Third16"),randomize("Fourth16"),
                          "DistItem"+writtenOrAudioAdvice,randomize( "Fifth16"),randomize("Sixth16"),
                          "FinalScreen"+writtenOrAudioReplay,"recall","amt");

//var shuffleSequence = seq(randomize("First16"),randomize("Second16"),"ExpItem",randomize("Third16"),randomize("Fourth16"),"DistItem",randomize( "Fifth16"),randomize("Sixth16"),"FinalScreen");
//var practiceItemTypes = ["practice"];

var defaults = [
    "LQuestion", {
             as: ["F","J"],
             randomOrder: false,
             showNumbers: false,
             presentHorizontally: true,
             autoFirstChar: true
    },
    "Message", {
        hideProgressBar: true
    }
];


define_ibex_controller({
    name: "Questionnaire",

    jqueryWidget: {
        _init: function () {
            this.options.transfer = null; // Remove 'click to continue message'.         
            this.element.VBox({
                options: this.options,
                triggers: [3],
                children: [
                    "Message", { html: { include: "instrctns_postexpermnt_prequaire_allconds.html"}, transfer: null },
                    "Message", { html: { include: this.options.repeatedadvice }, transfer: null },
                    "Message", { html: { include: this.options.thinkcarefully }, transfer: null },
                    "Form", { html: { include: this.options.questionnaire }}
                ]
            });
        }
    },

    properties: { }
});


define_ibex_controller({
    name: "LexDecision",

    jqueryWidget: {
        _init: function () {
            this.options.transfer = null; // Remove 'click to continue message'.         
            this.element.VBox({
                options: this.options,
                triggers: [1],
                children: [
//                  "Message", { html: '<html><div style="text-align: center; margin:auto;">  <img src="http://files.lab.florianschwarz.net/ibexfiles/LucyCate/mic.png" style="height: 200px; text-align: center;" />  <audio controls autoplay preload="auto" style="display: none;">    <source src="http://files.lab.florianschwarz.net/ibexfiles/LucyCate/LDSF/'+ this.options.word + '.mp3" type="audio/mpeg" />    We are sorry but your system does not support the audio.</audio></div></html>', transfer: null },
                    "Message", { html: '<html><div style="text-align: center; margin:auto;">  <audio controls autoplay preload="auto" style="display: none;">    <source src="http://files.lab.florianschwarz.net/ibexfiles/LucyCate/LDSF/'+ this.options.word + '.mp3" type="audio/mpeg" />    We are sorry but your system does not support the audio.</audio></div></html>', transfer: null },
                    "LQuestion", { q: this.options.word,
                                  hasCorrect: this.options.right,
                                   leftComment: "<b>F</b>: Word",
                                   rightComment: "<b>J</b>: Not a word"}
                ]
            });
        }
    },

    properties: { }
});


var writtenAdvice = function (page) {
    
    return {
        
        page: "<div id='page'></div>",
        clickableAnswers: false,
        answers: {Continue: ["~", "Press F or J to continue."], Else: ["~", ""]},
        sequence: [
            {this: "page"},
            function(x){
                $("#page").html(htmlCodeToDOM({include:page}));
            },
            {pause: 500},
            function(x){
                $("#sound")[0].play();
                $("#first").css("display", "block");
                $("#typing").css("display", "none");
            },
            {pause: 300},
            function(x){
                $("#typing").css("display", "block");
            },
            {pause: 2500},
            function(x){
                $("#sound")[0].play();
                $("#second").css("display", "block");
                $("#typing").css("display", "none");
                x.safeBind($(document),"keydown", function(e) {
                  if (e.keyCode == "F".charCodeAt(0) || e.keyCode == "J".charCodeAt(0))
                    x.finishedCallback([[["Event", "End of chatbox"],
                                     ["Timestamp", Date.now()], ["Correct", "NULL"],
                                     ["Time", Date.now() - x.creationTime]]]);
                });
            },
            {this: "answers"}
        ]
        
    };
    
};


var items = [
    
    ["Instructions", "Message", {
        transfer: "click",
        html: {include: "consentform.html"}
    }],

    (ISLL ? // If we are in the LL instructions condition
     
        ["Instructions",
            "Message", {
                html: { include: "llinstructions.html" }
            },
            "Message", {
                html: { include: "audioinstructions.html" },
                transfer: "keypress",
                continueMessage: "Press F or J to continue..."
            }
        ]
        
    : // If we are not in the LL instructions condition
        
        ["Instructions",
            "Message", {
                html: { include: "audioinstructions.html" },
                transfer: "keypress",
                continueMessage: "Press F or J to continue..."
            }
        ]
     
    ), // The closing parenthesis indicates the end of the conditional and the comma indicates separates this item from the next item
    
    ["ExpItemWritten", "Preloader", { host: "http://files.lab.florianschwarz.net/ibexfiles/LucyCate/", files: ["notification.mp3"] } ],
    
    ["ExpItemWritten", "DynamicQuestion", writtenAdvice("slowly_written.html")],
    
    ["ExpItemAudio",
        "Message",
            (ISINS ? // If we are in the INS condition
             
             {
                 transfer: "keypress",
                 html: {include: (ITEMID == 1 ? "item1_INS_audio.html" : "item2_INS_audio.html") }  // A single line conditional
             }
            
            : // If we are not in the INS condition
              
             {
                 transfer: "keypress",
                 html: {include: (ITEMID == 1 ? "item1_nonINS_audio.html" : "item2_nonINS_audio.html") }
             }
     
            ) // The closing parenthesis indicates the end of the conditional
    ],
    
    
    ["DistItemWritten", "DynamicQuestion", writtenAdvice("breath_written.html")],
    
    ["DistItemAudio",
        "Message", {
            transfer: "keypress",
            html: {include: "distractor_audio.html" }
        }
    ],
    
    ["FinalScreen",
        "Preloader", {
            host: "http://files.lab.florianschwarz.net/ibexfiles/LucyCate/",
            files: ["item1INSrepondslowly.mp3", "distractorclearmind.mp3"]
        }
    ],

    ["FinalScreenWritten",
        "Questionnaire", {
            repeatedadvice: ( REPEATADVICE ? "rptdadvc_form"+ITEMID+"_"+(ISINS ? "INS" : "non-INS")+".html" : "blank.html" ),
            thinkcarefully: ( ISLL ? "instrctns_postexpermnt2_thnkcrfly.html" : "blank.html" ),
            questionnaire: ("questionform"+ITEMID+".html") //"example_form.html"
         }
     
    ],
    
    ["FinalScreenAudio",
        "DynamicQuestion", {
            
            enabled: false,
            
            answers: {Continue: "Click here to continue."},
            
            /*preAllConds: htmlCodeToDOM({include:"instrctns_postexpermnt_prequaire_allconds.html"}),
            audioPage: htmlCodeToDOM({include:"audiorepeatadvice.html"}),
            repeatedadvice: htmlCodeToDOM({include:
                                           ( REPEATADVICE ? "rptdadvc_form"+ITEMID+"_"+(ISINS ? "INS" : "non-INS")+".html" : "blank.html" )
                                          }),
            thinkcarefully: htmlCodeToDOM({include:
                                           ( ISLL ? "instrctns_postexpermnt2_thnkcrfly.html" : "blank.html" ),
                                          }),
            questionnaire: htmlCodeToDOM({include:"questionform"+ITEMID+".html"}),*/
     
            sequence: [
                
                "<div id='preAllConds'></div>",
                "<div id='audioPage'></div>",
                "<div id='thinkcarefully'></div>",
                "<div id='questionnaire'></div>",
                function(t){
                    $("#preAllConds").html(htmlCodeToDOM({include:"instrctns_postexpermnt_prequaire_allconds.html"}));
                    $("#audioPage").html(htmlCodeToDOM({include:"audiorepeatadvice"+trimmedAudioRepetition+".html"}));
                    $("#thinkcarefully").html(htmlCodeToDOM({include:
                                           ( ISLL ? "instrctns_postexpermnt2_thnkcrfly.html" : "blank.html" ),
                                          }));
                    $("#questionnaire").html(htmlCodeToDOM({include:"questionform"+ITEMID+".html"}));
                    
                    // $("#thinkcarefully, #questionnaire").css("display", "none");
                    
                    $("#preAllConds, #audioPage, #repeatadvice, #thinkcarefully, #questionnaire").css("text-align", "left");
                },
                function(t){                    
                    t.ArrayOfAnswers = [];
                    
                    t.ArrayOfAnswers.push([
                          ["Event", "Page appears"],
                          ["ControlID", "wholePage"],
                          ["Timecode", "NULL"],
                          ["Time", t.creationTime]
                        ]);
                    
                    t.HasPlayedFile = function() {
                        if (this.id == "aud1") t.aud1played = true;
                        else if (this.id == "aud2") t.aud2played = true;
                        
                        $(this).parent().children()[0].src = "http://files.lab.florianschwarz.net/ibexfiles/Pictures/Replay.png";
                        $("#audioBtn1, #audioBtn2").css({"opacity":"1", "filter": "alpha(opacity=100)"});
                        // if(t.aud1played && t.aud2played) $("#thinkcarefully, #questionnaire").css("display", "block");
                        
                        t.ArrayOfAnswers.push([
                            ["Event", "Playback Ended"],
                            ["ControlID", this.id],
                            ["Timecode", this.currentTime],
                            ["Time", new Date().getTime() - t.creationTime]
                        ]);
                    }
                        
                    t.SubmitAnswers = function() {
                        
                        var rads = $(document).find("input[type=radio]");
                        // Sort by name.
                        var rgs = { };
                        for (var i = 0; i < rads.length; ++i) {
                            var rad = $(rads[i]);
                            if (rad.attr('name')) {
                                if (! rgs[rad.attr('name')])
                                    rgs[rad.attr('name')] = [];
                                rgs[rad.attr('name')].push(rad);
                            }
                        }
                        for (k in rgs) {
                            // Check if it's oblig.
                            var oblig = false;
                            var oneIsSelected = false;
                            var oneThatWasSelected;
                            var val;
                            for (var i = 0; i < rgs[k].length; ++i) {
                                if (rgs[k][i].hasClass('obligatory')) oblig = true;
                                if (rgs[k][i].attr('checked')) {
                                    oneIsSelected = true;
                                    oneThatWasSelected = i;
                                    val = rgs[k][i].attr('value');
                                }
                            }
                            if (oblig && (! oneIsSelected)) {
                              alertOrAddError(rgs[k][0].attr('name'), t.obligatoryRadioErrorGenerator(rgs[k][0].attr('name')));
                              return;
                            }
                            if (oneIsSelected) {
                              t.ArrayOfAnswers.push([["Field name", rgs[k][0].attr('name')],
                                           ["Field value", rgs[k][oneThatWasSelected].attr('value')]]);
                            }
                        }
                        
                        t.finishedCallback(t.ArrayOfAnswers);
                     
                    }
                    
                    t.ClickOnPlay = function(audio) {
                        t.ArrayOfAnswers.push([
                          ["Event", "Play audio"],
                          ["ControlID", this.id],
                          ["Timecode", this.currentTime],
                          ["Time", new Date().getTime() - t.creationTime]
                        ]);
                    };
                
                    t.ClickOnPause = function(audio) {
                        t.ArrayOfAnswers.push([
                          ["Event", "Pause audio"],
                          ["ControlID", this.id],
                          ["Timecode", this.currentTime],
                          ["Time", new Date().getTime() - t.creationTime]
                        ]);
                    };
     
                    t.ClickOnSeek = function(audio) {
                        t.ArrayOfAnswers.push([
                          ["Event", "Seek audio"],
                          ["ControlID", this.id],
                          ["Timecode", this.currentTime],
                          ["Time", new Date().getTime() - t.creationTime]
                        ]);
                    };

                    t.ClickedOnSeek = function(audio) {
                        t.ArrayOfAnswers.push([
                          ["Event", "Audio seeked"],
                          ["ControlID", this.id],
                          ["Timecode", this.currentTime],
                          ["Time", new Date().getTime() - t.creationTime]
                        ]);
                    };
                
                    t.ClickOnRadio = function(radio) {
                        t.ArrayOfAnswers.push([
                          ["Event", "Click on radio"],
                          ["ControlID", this.id],
                          ["Timecode", this.currentTime],
                          ["Time", new Date().getTime() - t.creationTime]
                        ]);
            
                        if ($("input:checked").length == 5 && typeof $(".Message-continue-link")[0] == "undefined")
                          t.element.append($("<a class='Message-continue-link'>â†’ Click here to continue.</a>")
                                           .bind("click", t.SubmitAnswers));
                    };

                    t.ClickOnBtn = function(btn) {
                        if ($("#audioBtn1").css("opacity") != "1") return;
                        $(this).children()[0].src = "http://files.lab.florianschwarz.net/ibexfiles/Pictures/Playing.png";
                        $("#audioBtn1, #audioBtn2").css({"opacity":".50", "filter": "alpha(opacity=50)"});
                        $(this).children()[1].play();
                    }
                
                    $("#aud1").bind("ended", t.HasPlayedFile);
                    $("#aud2").bind("ended", t.HasPlayedFile);
                    $("#aud1, #aud2").bind("play", t.ClickOnPlay);
                    $("#aud1, #aud2").bind("pause", t.ClickOnPause);
                    $("#aud1, #aud2").bind("seeked", t.ClickOnSeek);
                    $("#aud1, #aud2").bind("seeking", t.ClickedOnSeek);

                    $("#audioBtn1, #audioBtn2").bind("click", t.ClickOnBtn);

                    $("input").bind("click", t.ClickOnRadio);
                
                }
            ]
        }
     ],  

    
    /*["FinalScreen",
        "Questionnaire", {
            repeatedadvice: ( REPEATADVICE ? "rptdadvc_form"+ITEMID+"_"+(ISINS ? "INS" : "non-INS")+".html" : "blank.html" ),
            thinkcarefully: ( ISLL ? "instrctns_postexpermnt2_thnkcrfly.html" : "blank.html" ),
            questionnaire: ("questionform"+ITEMID+".html") //"example_form.html"
         }
     
    ],*/
    // From here on are the items for the embedded lexical decision experiment
    ["First16","LexDecision", {word: "plowl",right: 1}],
    ["First16","LexDecision", {word: "fout",right: 1}],
    ["First16","LexDecision", {word: "slox",right: 1}],
    ["First16","LexDecision", {word: "lub",right: 1}],
    ["First16","LexDecision", {word: "pobd",right: 1}],
    ["First16","LexDecision", {word: "pakth",right: 1}],
    ["First16","LexDecision", {word: "tertz",right: 1}],
    ["First16","LexDecision", {word: "foon",right: 1}],
    ["First16","LexDecision", {word: "smile",right: 0}],
    ["First16","LexDecision", {word: "golf",right: 0}],
    ["First16","LexDecision", {word: "worth",right: 0}],
    ["First16","LexDecision", {word: "duck",right: 0}],
    ["First16","LexDecision", {word: "beat",right: 0}],
    ["First16","LexDecision", {word: "nose",right: 0}],
    ["First16","LexDecision", {word: "loaf",right: 0}],
    ["First16","LexDecision", {word: "wine",right: 0}],
    ["Second16","LexDecision", {word: "naint",right: 1}],
    ["Second16","LexDecision", {word: "dit",right: 1}],
    ["Second16","LexDecision", {word: "groud",right: 1}],
    ["Second16","LexDecision", {word: "geel",right: 1}],
    ["Second16","LexDecision", {word: "petch",right: 1}],
    ["Second16","LexDecision", {word: "vop",right: 1}],
    ["Second16","LexDecision", {word: "hilm",right: 1}],
    ["Second16","LexDecision", {word: "wung",right: 1}],
    ["Second16","LexDecision", {word: "lump",right: 0}],
    ["Second16","LexDecision", {word: "beast",right: 0}],
    ["Second16","LexDecision", {word: "path",right: 0}],
    ["Second16","LexDecision", {word: "pad",right: 0}],
    ["Second16","LexDecision", {word: "sot",right: 0}],
    ["Second16","LexDecision", {word: "face",right: 0}],
    ["Second16","LexDecision", {word: "throat",right: 0}],
    ["Second16","LexDecision", {word: "camp",right: 0}],
    ["Third16","LexDecision", {word: "plowl",right: 1}],
    ["Third16","LexDecision", {word: "fout",right: 1}],
    ["Third16","LexDecision", {word: "slox",right: 1}],
    ["Third16","LexDecision", {word: "lub",right: 1}],
    ["Third16","LexDecision", {word: "pobd",right: 1}],
    ["Third16","LexDecision", {word: "pakth",right: 1}],
    ["Third16","LexDecision", {word: "tertz",right: 1}],
    ["Third16","LexDecision", {word: "foon",right: 1}],
    ["Third16","LexDecision", {word: "smile",right: 0}],
    ["Third16","LexDecision", {word: "golf",right: 0}],
    ["Third16","LexDecision", {word: "worth",right: 0}],
    ["Third16","LexDecision", {word: "duck",right: 0}],
    ["Third16","LexDecision", {word: "beat",right: 0}],
    ["Third16","LexDecision", {word: "nose",right: 0}],
    ["Third16","LexDecision", {word: "loaf",right: 0}],
    ["Third16","LexDecision", {word: "wine",right: 0}],
    ["Fourth16","LexDecision", {word: "naint",right: 1}],
    ["Fourth16","LexDecision", {word: "dit",right: 1}],
    ["Fourth16","LexDecision", {word: "groud",right: 1}],
    ["Fourth16","LexDecision", {word: "geel",right: 1}],
    ["Fourth16","LexDecision", {word: "petch",right: 1}],
    ["Fourth16","LexDecision", {word: "vop",right: 1}],
    ["Fourth16","LexDecision", {word: "hilm",right: 1}],
    ["Fourth16","LexDecision", {word: "wung",right: 1}],
    ["Fourth16","LexDecision", {word: "lump",right: 0}],
    ["Fourth16","LexDecision", {word: "beast",right: 0}],
    ["Fourth16","LexDecision", {word: "path",right: 0}],
    ["Fourth16","LexDecision", {word: "pad",right: 0}],
    ["Fourth16","LexDecision", {word: "sot",right: 0}],
    ["Fourth16","LexDecision", {word: "face",right: 0}],
    ["Fourth16","LexDecision", {word: "throat",right: 0}],
    ["Fourth16","LexDecision", {word: "camp",right: 0}],
    ["Fifth16","LexDecision", {word: "plowl",right: 1}],
    ["Fifth16","LexDecision", {word: "fout",right: 1}],
    ["Fifth16","LexDecision", {word: "slox",right: 1}],
    ["Fifth16","LexDecision", {word: "lub",right: 1}],
    ["Fifth16","LexDecision", {word: "pobd",right: 1}],
    ["Fifth16","LexDecision", {word: "pakth",right: 1}],
    ["Fifth16","LexDecision", {word: "tertz",right: 1}],
    ["Fifth16","LexDecision", {word: "foon",right: 1}],
    ["Fifth16","LexDecision", {word: "smile",right: 0}],
    ["Fifth16","LexDecision", {word: "golf",right: 0}],
    ["Fifth16","LexDecision", {word: "worth",right: 0}],
    ["Fifth16","LexDecision", {word: "duck",right: 0}],
    ["Fifth16","LexDecision", {word: "beat",right: 0}],
    ["Fifth16","LexDecision", {word: "nose",right: 0}],
    ["Fifth16","LexDecision", {word: "loaf",right: 0}],
    ["Fifth16","LexDecision", {word: "wine",right: 0}],
    ["Sixth16","LexDecision", {word: "naint",right: 1}],
    ["Sixth16","LexDecision", {word: "dit",right: 1}],
    ["Sixth16","LexDecision", {word: "groud",right: 1}],
    ["Sixth16","LexDecision", {word: "geel",right: 1}],
    ["Sixth16","LexDecision", {word: "petch",right: 1}],
    ["Sixth16","LexDecision", {word: "vop",right: 1}],
    ["Sixth16","LexDecision", {word: "hilm",right: 1}],
    ["Sixth16","LexDecision", {word: "wung",right: 1}],
    ["Sixth16","LexDecision", {word: "lump",right: 0}],
    ["Sixth16","LexDecision", {word: "beast",right: 0}],
    ["Sixth16","LexDecision", {word: "path",right: 0}],
    ["Sixth16","LexDecision", {word: "pad",right: 0}],
    ["Sixth16","LexDecision", {word: "sot",right: 0}],
    ["Sixth16","LexDecision", {word: "face",right: 0}],
    ["Sixth16","LexDecision", {word: "throat",right: 0}],
    ["Sixth16","LexDecision", {word: "camp",right: 0}],

    // Preloading the audio files
    ["Preload", "Preloader", {
      host: "http://files.lab.florianschwarz.net/ibexfiles/LucyCate/LDSF/",
      files: ["beast.mp3","beat.mp3","camp.mp3","dit.mp3","duck.mp3","face.mp3","foon.mp3","fout.mp3",
              "geel.mp3","golf.mp3","groud.mp3","hilm.mp3","loaf.mp3","lub.mp3","lump.mp3","naint.mp3",
              "nose.mp3","pad.mp3","pakth.mp3","path.mp3","petch.mp3","plowl.mp3","pobd.mp3","slox.mp3",
              "smile.mp3","sot.mp3","tertz.mp3","throat.mp3","vop.mp3","wine.mp3","worth.mp3","wung.mp3"]
    }],

    ["Preload", "PreloaderCheck", {}],

    ["recall", "Form", {
      html: {include: "verbatimrecallinstructions.html"}
    }],

    
    // Handling MTurk
    ["amt", "Form", {
        html: {include: "amt_form.html"}
    }],
    
    ["amt", "__SendResults__", {
       manualSendResults: true,
       sendingResultsMessage: "Please wait while your answers are being saved.",
       completionMessage: "Your answers have successfully being saved!"
    }],
    
    ["amt", "Message", {
        transfer: null,
        html: {include: "confirmation.html"}
    }]
];