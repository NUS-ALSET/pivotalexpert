(function() {

  angular
    .module('app.contentMgmt')
    .factory('contentMgmtService', contentMgmtService);


  
  function contentMgmtService($q,$firebaseObject,$firebaseArray, $firebaseAuth,$location, commonService) {

  	//updating chapterNode

  	// get node of course content and course map
    var ref = firebase.database().ref();
  	var courseSeqNodeRef = ref.child('courseSequence');
    var chapterNodeRef = ref.child('course/chapters');
    var questionNodeRef = ref.child('course/questions');
    var answerKeyNodeRef = ref.child('answerKey');
    
    // generate new Qid
    //var newQid = questionNodeRef.push().key;
    
    var service = {
        updateChapter: updateChapter,
        getAllChapters: getAllChapters,
        getCourseSeq:getCourseSeq,
        getChapter:getChapter,
        updateCourseSeq:updateCourseSeq,
        deleteChapter:deleteChapter,
        getQuestion:getQuestion,
        updateVideoQuestion:updateVideoQuestion,
        updateSlideQuestion:updateSlideQuestion,
        updateQuestionSeq:updateQuestionSeq,
        getChapterIndex:getChapterIndex,
        deleteQuestion:deleteQuestion,
        updateEntireSeq:updateEntireSeq,
        getAnswerKey:getAnswerKey,
        updateMCQ:updateMCQ,
        updateExcel:updateExcel,
        updateCodebox:updateCodebox

    };
    
    return service;    
    
    //chapter functions
    function updateChapter (chapter,isNewChapter) {
        // retrieve courseSeq node
        var courseSeq = $firebaseObject(courseSeqNodeRef);
        courseSeq.$loaded().then(function(){
                // if user wants to create chapter
            var cid = chapter.cid;
            if(isNewChapter) {
                // checking if chapterTitle already exist
                for(var element in courseSeq) {
                    if(element.chapterTitle === chapter.chapterTitle) {
                        //response this chapter is being used now.
                        return "This chapter name is being used now.";
                    }
                }
            }

            if(chapter.cid) {
                //generate new cid
                cid = 000;
            }
            // create new chapter node & fill it up
            var chapterNode = {helpRoomCode:"",chapterTitle:""};
            // create courseSeq node & fill it up
            var courseSeqNode = {cid:cid,chapterTitle:""};
            // update database
            chapterNodeRef.update({cid:chapterNode});
            courseSeqNodeRef.update(courseSeqNode,function onComplete(){
                if(isNewChapter) {
                    return "Chapter created!"
                }else {
                    return "Chapter updated!"
                }
            });
        });
    }

    function getAllChapters(){
    //get all editible chapter information for all chapters
        var chapters = $firebaseObject(chapterNodeRef);
        chapters.$loaded().then(function(){
            return chapters;
        });
    // return them
    }

    function getCourseSeq(){
        return $firebaseArray(courseSeqNodeRef);
    }

    function getChapter(cid) {
        chapterNodeRef.once("value", function(snapshot) {
            snapshot.forEach(function(element) {
                if(cid === element.key) {
                    return $firebaseObject(chapterNodeRef.child(cid));
                }
            });
        });
    }

    function updateCourseSeq(courseSeq) {
        var newCourseSeq = [];
        var currentSeq = getCourseSeq();
        currentSeq.$loaded().then(function(){
            for(i=0;i<courseSeq.length;i++) {
                for(var chapter in courseSeq) {
                    if(courseSeq[i].title === currentSeq.chapterTitle){
                        newCourseSeq.push(chapter);
                    }
                }
            }

            courseSeqNodeRef.update(newCourseSeq);
        });
    }

    function updateEntireSeq(courseSequence) {
        var q = $q.defer();
        courseSeqNodeRef.set(courseSequence,function(error){
            q.resolve(true);
        });
        return q.promise;
    }

    //questions functions
    function getQuestion(qid) {
        return $firebaseObject(ref.child('course/questions/'+qid));
    }

    function updateVideoQuestion(question,isNewQuestion) {
        var q =$q.defer();
        // retrieve courseSeq node
        var questionNode = $firebaseObject(questionNodeRef);
        questionNode.$loaded().then(function(){
                // if user wants to create chapter
            var qid = question.qid;
            var cid = question.cid;

            if(isNewQuestion) {
                // checking if chapterTitle already exist
                for(var element in questionNode) {
                    if(element.qnsTitle === question.qnsTitle) {
                        //response this chapter is being used now.
                        return "This Question Title is being used now.";
                    }
                }

            }

            if(!qid) {
                //generate new qid
                qid =000;
                question.qid = 000;
            }
            // create new question node & fill it up

            var questionNode = {
                                qnsDescription:question.qnsDescription,
                                qnsInstruction:question.qnsInstruction,
                                qnsTitle:question.qnsTitle,
                                qnsType:question.qnsType,
                                link:question.link
                            };
            // create courseSeq node & fill it up
            var questionSeqNode = {qid:question.qid,qnsTitle:question.qnsTitle,qnsType:question.qnsType};

            // update database
            questionNodeRef.child(qid).update(questionNode);

            var courseArray = $firebaseObject(courseSeqNodeRef);
            getChapterIndex(cid).then(function(chapIndex){
                if(!isNewQuestion) {
                    getQnsIndex(chapIndex,qid).then(function(qnsIndex){
                        courseArray.$loaded().then(function(){
                            if(courseArray[chapIndex]!=null) {
                                qnsIndex = ""+qnsIndex;
                                courseArray[chapIndex].qns[qnsIndex] = questionSeqNode;
                                    courseArray.$save(chapIndex).then(function(){
                                        q.resolve(true);
                                        if(isNewQuestion) {
                                            return "Question created!"
                                        }else {
                                            return "Question updated!"
                                        }
                                    });
                            }
                        });
                    });
                }else {
                    courseArray.$loaded().then(function(){
                        if(courseArray[chapIndex]!=null) {
                            courseArray[chapIndex].qns.push(questionSeqNode);
                            courseArray.$save(chapIndex).then(function(){
                                q.resolve(true);
                                if(isNewQuestion) {
                                    return "Question created!"
                                }else {
                                    return "Question updated!"
                                }
                            });
                        }
                    });
                }
            });
        });
        return q.promise;
    }

    function updateSlideQuestion(question,isNewQuestion) {
        // retrieve courseSeq node
        var questionNode = $firebaseObject(questionNodeRef);
        var q =$q.defer();
        questionNode.$loaded().then(function(){
                // if user wants to create chapter
            var qid = question.qid;
            var cid = question.cid;

            if(isNewQuestion) {
                // checking if chapterTitle already exist
                for(var element in questionNode) {
                    if(element.qnsTitle === question.qnsTitle) {
                        //response this chapter is being used now.
                        return "This Question Title is being used now.";
                    }
                }

            }

            if(!qid) {
                //generate new qid
                qid =000;
                question.qid = 000;
            }
            // create new question node & fill it up
            var tempSlides = question.slides;
            question.slides =[];
            for(var i = 0; i<tempSlides.length;i++){
                var currentSlide = {
                    explanation:tempSlides[i]['explanation'],
                    imageLink:tempSlides[i]['imageLink']
                }
                question.slides.push(currentSlide);
            }

            var questionNode = {
                                qnsTitle:question.qnsTitle,
                                qnsType:question.qnsType,
                                slides:question.slides
                            };
            // create courseSeq node & fill it up
            var questionSeqNode = {qid:question.qid,qnsTitle:question.qnsTitle,qnsType:question.qnsType};
            // update database
            questionNodeRef.child(qid).update(questionNode);
            var courseArray = $firebaseObject(courseSeqNodeRef);
            getChapterIndex(cid).then(function(chapIndex){
                if(!isNewQuestion) {
                    getQnsIndex(chapIndex,qid).then(function(qnsIndex){
                        courseArray.$loaded().then(function(){
                            if(courseArray[chapIndex]!=null) {
                                qnsIndex = ""+qnsIndex;
                                courseArray[chapIndex].qns[qnsIndex] = questionSeqNode;
                                    courseArray.$save(chapIndex).then(function(){
                                        q.resolve(true);
                                        if(isNewQuestion) {
                                            return "Question created!"
                                        }else {
                                            return "Question updated!"
                                        }
                                    });
                            }
                        });
                    });
                }else {
                    courseArray.$loaded().then(function(){
                        if(courseArray[chapIndex]!=null) {
                            courseArray[chapIndex].qns.push(questionSeqNode);
                            courseArray.$save(chapIndex).then(function(){
                                q.resolve(true);
                                if(isNewQuestion) {
                                    return "Question created!"
                                }else {
                                    return "Question updated!"
                                }
                            });
                        }
                    });
                }
            });
        });
        return q.promise;
    }

    function updateQuestionSeq(questionSeq,cid) {
        var newQuestionSeq = [];
        var index = getChapterIndex(cid);
        var currentSeq = $firebaseObject(courseSeqNodeRef.child(index+'/qns'));
        currentSeq.$loaded().then(function(){
            for(i=0;i<questionSeq.length;i++) {
                for(var chapter in questionSeq) {
                    if(questionSeq[i].title === currentSeq.qnsTitle){
                        newQuestionSeq.push(chapter);
                    }
                }
            }
            courseSeqNodeRef.child(index+'/qns').update(newQuestionSeq);
        });
    }

    function getChapterIndex(cid) {
        var courseSeq = $firebaseObject(courseSeqNodeRef);
        var q =$q.defer();
        courseSeq.$loaded().then(function(){
            angular.forEach(courseSeq, function(value, key) {
                if(value.cid === cid) {
                    q.resolve(key);
                    return false;
                }
            });
        });
        return q.promise;	
    }

    function getQnsIndex(chapIndex,qid) {
        var courseSeq = $firebaseArray(courseSeqNodeRef);
        var q = $q.defer();
        
        var hasKey = false;
        
        courseSeq.$loaded().then(function(){
            var qnsArr = courseSeq[chapIndex].qns;
            angular.forEach(qnsArr, function(value, key) {
                if(value.qid === qid) {
                    q.resolve(key);
                    hasKey = true;
                    return;
                }
            });
            if (!hasKey) {
                q.resolve(qnsArr.length);
            }
        });
        return q.promise;
    }
    
    function deleteQuestion (cid,qid) {
        // get chapter qns and delete them
        var userProfileNodeRef = ref.child('userProfiles');
        var courseArray = $firebaseObject(courseSeqNodeRef);
        var q = $q.defer();

        getChapterIndex(cid).then(function(chapIndex){
            getQnsIndex(chapIndex,qid).then(function(qnsIndex){
                courseArray.$loaded().then(function(){
                    if(courseArray[chapIndex]!=null) {
                        courseArray[chapIndex].qns.splice(qnsIndex,1);
                        courseArray.$save().then(function(ref) {
                            // data has been deleted locally and in the database
                            console.log(ref);
                        }, function(error) {
                            console.log("Error:", error);

                        });
                        ref.child('course/questions/'+qid).remove();
                        ref.child('answerKey/'+qid).remove();

                        userProfileNodeRef.once("value", function(snapshot){
                            // for each user, remove from their courseProgress the current qns
                            snapshot.forEach(function(user) {
                                var key = user.key;
                                userProfileNodeRef.child(key+'/courseProgress/'+qid).remove();
                            });
                            q.resolve(true);
                        });
                    }
                });
            });
        });

        return q.promise;
    }

    function deleteQuestionFromCM(qidList){
        if(qidList.length==0){
            return false;
        }
        var userProfileNodeRef = ref.child('userProfiles');
            $.each(qidList,function(key,value){
                ref.child('course/questions/'+value).remove();
                ref.child('answerKey/'+value).remove();

                userProfileNodeRef.once("value", function(snapshot){
                    // for each user, remove from their courseProgress the current qns
                    snapshot.forEach(function(user) {
                        var key = user.key;
                        userProfileNodeRef.child(key+'/courseProgress/'+value).remove();
                    });
                });
            });
        
    }  

    function deleteChapter (cidList) {
        // get chapter qns and delete them
        var q = $q.defer();
        if(cidList.length==0){
            q.resolve(false);
        }
        var userProfileNodeRef = ref.child('userProfiles');
        var courseArray = $firebaseObject(courseSeqNodeRef);
        
            $.each(cidList,function(key,value){

                getChapterIndex(value).then(function(chapIndex){
                    courseArray.$loaded().then(function(){
                        if(courseArray[chapIndex]!=null) {
                            var chapToDelete = courseArray[chapIndex];
                            // deleting each question in this chapter from question and answerKey node 
                            angular.forEach(chapToDelete.qns, function(value, key) {
                                ref.child('course/questions/'+value.qid).remove();
                                ref.child('answerKey/'+value.qid).remove();
                            });

                            // deleting the chapter from course node
                            ref.child('course/chapters/'+value).remove();

                            userProfileNodeRef.once("value", function(snapshot){
                                // for each user, remove from their courseProgress the current qns
                                snapshot.forEach(function(user) {
                                    var key = user.key;
                                    angular.forEach(chapToDelete.qns, function(value, key) {
                                        userProfileNodeRef.child(key+'/courseProgress/'+value.qid).remove();
                                    });
                                });
                                q.resolve(true);
                            });
                        }
                    });
                });
            });
        
        return q.promise;	
    }

    function getAnswerKey(qid){
        return $firebaseObject(answerKeyNodeRef.child(qid));
    }

    function updateMCQ(question,isNewQuestion) {
        // retrieve courseSeq node
        var questionNode = $firebaseObject(questionNodeRef);
        var q =$q.defer();
        questionNode.$loaded().then(function(){
                // if user wants to create chapter
            var qid = question.qid;
            var cid = question.cid;

            if(isNewQuestion) {
                // checking if chapterTitle already exist
                for(var element in questionNode) {
                    if(element.qnsTitle === question.qnsTitle) {
                        //response this chapter is being used now.
                        return "This Question Title is being used now.";
                    }
                }

            }

            if(!qid) {
                //generate new qid
                qid = 000;
            }
            // create new question node & fill it up
            var answer = [];
            // create answerkey node & fill it up
            $.each(question.mcq, function(index,value){
                answer.push(value.answer);
                delete value.answer;
            });

            delete question.$$conf;
            delete question.$priority;
            delete question.cid;
            delete question.$id;

            var questionNode = question;
            // create courseSeq node & fill it up
            var questionSeqNode = {qid:question.qid,qnsTitle:question.qnsTitle};
            
            // update database
            questionNodeRef.child(qid).update(questionNode);
            answerKeyNodeRef.child(qid).update({answer});
            var courseArray = $firebaseObject(courseSeqNodeRef);
            getChapterIndex(cid).then(function(chapIndex){
                getQnsIndex(chapIndex,qid).then(function(qnsIndex){
                    courseArray.$loaded().then(function(){
                        if(courseArray[chapIndex]!=null) {
                            qnsIndex = ""+qnsIndex;
                            courseArray[chapIndex].qns[qnsIndex] = questionSeqNode;
                                courseArray.$save(chapIndex).then(function(){
                                    q.resolve(true);
                                    if(isNewQuestion) {
                                        return "Question created!"
                                    }else {
                                        return "Question updated!"
                                    }
                                    
                                });
                        }

                    });
                });
            })
            .catch(function(reason){
                console.log("ERROR CAUGHT: "+ reason)
            });
        });
        return q.promise;
    }
  
    function updateExcel(question, isNewQuestion) {
        
        var q = $q.defer();
        
        // retrieve question node
        var questionNode = $firebaseObject(questionNodeRef);
        
        var validQnsTitle = true;
        var cid = question.cid;
        
        questionNode.$loaded().then(function(){
                           
            //Create new
            if(isNewQuestion) {
                var qid = questionNodeRef.push().key;


                // checking if chapterTitle already exist                
                questionNode.forEach(function(qns) {
                    if(qns.qnsTitle === question.qnsTitle) {
                        //Chapter Title Been used
                        validQnsTitle = false;
                        return;
                    }
                });
                
            } else {
                var qid = question.qid;
            }
            
            //Valid Question Title
            if(validQnsTitle || !isNewQuestion) {
                
                // create new answer nodes & fill it up
                var formulaCell = question.FormulaCell;
                var formulaUsed = question.FormulaUsed;
                var range = question.range;
                
                var answer = [];
                for (i = 0; i < question.answer.length; i++) { 
                    answer.push({col: question.answer[i].col, row: question.answer[i].row, value: question.answer[i].value});
                }
                
                

                delete question.cid;
                delete question.formulaCell;
                delete question.formulaUsed;
                delete question.range;
                delete question.answer;

                //Update to firebase question node
                questionNodeRef.child(qid).update(question);

                //Update to firebase answer node
                answerKeyNodeRef.child(qid).update({formulaCell:formulaCell, formulaUsed:formulaUsed, range:range, answer:answer});
               
                //Update course sequence
                var questionSeqNode = {qid:qid, qnsTitle:question.qnsTitle, qnsType: "excel"};
                
                //find the chapter cidIndex
                getChapterIndex(cid).then(function(chapIndex){
                    
                    var courseArray = $firebaseObject(courseSeqNodeRef);
                    getQnsIndex(chapIndex,qid).then(function(qnsIndex){
                        
                        courseArray.$loaded().then(function(){

                            if(courseArray[chapIndex]!=null) {
                                
                                //Update to firebase sequence node
                                courseSeqNodeRef.child(chapIndex + "/qns/" + qnsIndex).update(questionSeqNode);
                            }
                        });
                    });
                })
                .catch(function(reason){
                    console.log("ERROR CAUGHT: "+ reason)
                });
            } else {
                q.resolve("This Question Title is being used now.");
            }

        });
        
        return q.promise;
           
       
    }
  
    function updateCodebox(question, isNewQuestion) {
        
        var q = $q.defer();
        
        // retrieve question node
        var questionNode = $firebaseObject(questionNodeRef);
        
        var validQnsTitle = true;
        var cid = question.cid;
        
        questionNode.$loaded().then(function(){
                           
            //Create new
            if(isNewQuestion) {
                var qid = questionNodeRef.push().key;


                // checking if chapterTitle already exist                
                questionNode.forEach(function(qns) {
                    if(qns.qnsTitle === question.qnsTitle) {
                        //Chapter Title Been used
                        validQnsTitle = false;
                        return;
                    }
                });
                
            } else {
                var qid = question.qid;
            }
            
            //Valid Question Title
            if(validQnsTitle || !isNewQuestion) {
                // create new answer nodes & fill it up
                var testcode = question.testcode;
                var testcodeDeclare = question.testcodeDeclare;
                
                var testcases = [];
                for (i = 0; i < question.testcases.length; i++) { 
                    testcases.push(question.testcases[i].testcase);
                }

                delete question.cid;
                delete question.testcode;
                delete question.testcodeDeclare;
                delete question.testcases;

                //Update to firebase question node
                questionNodeRef.child(qid).update(question);

                //Update to firebase answer node
                answerKeyNodeRef.child(qid).update({testcode:testcode, testcodeDeclare:testcodeDeclare, testcases:testcases});
               
                //Update course sequence
                var questionSeqNode = {qid:qid, qnsTitle:question.qnsTitle, qnsType: "code"};
                
                //find the chapter cidIndex
                getChapterIndex(cid).then(function(chapIndex){
                    
                    var courseArray = $firebaseObject(courseSeqNodeRef);
                    getQnsIndex(chapIndex,qid).then(function(qnsIndex){
                        
                        courseArray.$loaded().then(function(){

                            if(courseArray[chapIndex]!=null) {
                                
                                //Update to firebase sequence node
                                courseSeqNodeRef.child(chapIndex + "/qns/" + qnsIndex).update(questionSeqNode);
                            }
                        });
                    });
                })
                .catch(function(reason){
                    console.log("ERROR CAUGHT: "+ reason)
                });
            } else {
                q.resolve("This Question Title is being used now.");
            }

        });
        
        return q.promise;
           
       
    }
    
  }

})();
