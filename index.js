module.exports = (app,hostname,port) => {
    const axios = require('axios');
    const cmd=require('node-cmd');
    const async = require('async');
    const phantom = require('phantom');
    const fs = require('fs');
    const { createLogger, format, transports } = require('winston');
    const { combine, timestamp, prettyPrint} = format;

    var arrFile = '/api_doc/json_helper.js';
    var json_arr; // Store the final APIs data in json_arr
    fs.access(arrFile, fs.constants.F_OK, (err) => {
        {err ? json_arr = [] : json_arr = require('./api_doc/json_helper') }
    });

    // Ignore log messages if they have { private: true }
    const ignorePrivate = format((info, opts) => {
        if (info.private) { return false; }
        return info;
      });

    const logger = createLogger({
        level: 'info',
        format: combine(
          ignorePrivate(),
          timestamp(),
          prettyPrint()
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: 'error.log' })
        ],
      })

    const config = require('./api_doc/config')
    if(!hostname) {
       logger.log({
            level: 'error',
            log: 'Hostname is undefined'
        });
        process.exit();
    }
    if(!port) {
       logger.log({
            level: 'error',
            log: 'Port is undefined'
        });
        process.exit();
    }
    const baseUrl = `${hostname}:${port}`;    // Initialized baseUrl path
    console.log("Node-api-doc-generator is ready at: ",baseUrl)

    // Initialized some constant array to pass the value as parameters
    const apiInt = config.apiInt
    const apiString = config.apiString
    const apiBool = config.apiBool
    const apiFloot = config.apiFloot

    var totalReq = 0;   // Flag for Request hit
    var totalRes = 0;   // Flag for Response get
    var jsonResult; // It store "CreateHtmlArt" final result 

    // Call all the APIS of the project
    apiCaller = (apiData,callback) => {
        async.forEachOf(apiData, function (apiValue, index, callback){ 
            if(apiValue.type !== '')
            {
                var apiPath;        // It store the path of the API
                var apiParam = '';  // It store the Parameter req.params of the API
                var apiBodyParam = '';  // It store the Parameter req.body of the API
                var reqParam = {}   // It store the resquest.params data of the APIs

                //Creating Path
                if(apiValue.type === 'get' || apiValue.type === 'delete' || apiValue.type === 'put')
                {
                    var end = apiValue.url.indexOf(":");    // Check ":" exists in the url or not
                    if(end !== -1)
                    {
                        apiPath = apiValue.url.slice(0,end-1);
                    } else {
                        apiPath = apiValue.url
                    }
                }
                else {
                    apiPath = apiValue.url
                }

                if(apiPath.indexOf("/") == -1)
                {
                    logger.log({
                        level: 'error',
                        log: 'API request url is missing in your annotation.'
                      });
                    process.exit();
                }

                // Creating Parameter
                if(apiValue.parameter != undefined)
                {
                    var temp = [];  // Initialized temp array to manage the parameter object
                    // Creating Params Parameter
                    var exist = apiValue.url.indexOf(":");  // Check ":" exists in the url or not
                    if(exist !== -1)
                    {
                        var num_matches = apiValue.url.match(/:/gi).length; // Count number of times ":" exists in the url
                            
                        apiValue.parameter.fields.Parameter.map((paramValue,index) => {
                            var randInt = apiInt[Math.floor(Math.random() * apiInt.length)];
                            var randString = apiString[Math.floor(Math.random() * apiString.length)];
                            var randBool = apiBool[Math.floor(Math.random() * apiBool.length)];
                            var randFloot = apiFloot[Math.floor(Math.random() * apiFloot.length)];
                           
                            if(index < num_matches)
                        {     
                            switch(paramValue.type) 
                                {
                                    case 'String' : {
                                        apiParam =  apiParam +'/' + randString;
                                        temp.push({[paramValue.field] : randString})
                                        break;
                                    }
                                    case 'id': {
                                        apiParam = apiParam +'/' + randInt;
                                        temp.push({[paramValue.field] : randInt})
                                        break;
                                    }
                                    case 'Number': {
                                        apiParam = apiParam +'/' + randInt;
                                        temp.push({[paramValue.field] : randInt})
                                        break;
                                    }
                                    case 'Boolean' : {
                                        apiParam = apiParam +'/' + randBool;
                                        temp.push({[paramValue.field] : randBool})
                                        break;
                                    }
                                    case 'Floot' : {
                                        apiParam = apiParam +'/' + randFloot;
                                        temp.push({[paramValue.field] : randFloot})
                                        break;
                                    }
                                    default :
                                    logger.log({
                                        level: 'info',
                                        message: "datatype not matched."
                                      });
                                }
                            }
                        })

                        // Merge all the parameter object as one object
                        reqParam = temp.reduce(function(result, currentObject) {
                            for(var key in currentObject) {
                                if (currentObject.hasOwnProperty(key)) {
                                    result[key] = currentObject[key];
                                }
                            }
                            return result;
                        }, {});

                        if(apiValue.type === 'put')
                        {
                            if(num_matches < apiValue.parameter.fields.Parameter.length)
                            {
                                 // Creating Body Parameter
                                var temp = [];  // Initialized temp array to manage the parameter object
                                var skip = num_matches;
                                createApiBodyParam(apiValue,temp,skip,function(data){
                                    temp = data;

                                    // Merge all the parameter object as one object
                                    apiBodyParam = temp.reduce(function(result, currentObject) {
                                        for(var key in currentObject) {
                                            if (currentObject.hasOwnProperty(key)) {
                                                result[key] = currentObject[key];
                                            }
                                        }
                                        return result;
                                    }, {});
                                    
                                });
                            }

                            reqParam = {params : reqParam, body : apiBodyParam}
                        }


                    } else {
                        // Creating Body Parameter
                        var temp = [];  // Initialized temp array to manage the parameter object
                        var skip = null;
                        createApiBodyParam(apiValue,temp,skip,function(data){
                            temp = data;

                            // Merge all the parameter object as one object
                            apiBodyParam = temp.reduce(function(result, currentObject) {
                                for(var key in currentObject) {
                                    if (currentObject.hasOwnProperty(key)) {
                                        result[key] = currentObject[key];
                                    }
                                }
                                return result;
                            }, {});
                            
                            reqParam = apiBodyParam                       
                        });
                    
                    }
                }

                // Assigning the "id" to each API objects
                var jsonObj = Object.assign({id : index}, apiValue);
                json_arr.push(jsonObj);

                // Calling APIs
                switch(apiValue.type)
                {
                    case 'get': {
                        setRequest(index,reqParam);
                        totalReq++
                        axios.get(baseUrl+apiPath+apiParam)
                            .then((response)=> {
                                if(response.headers['content-type']  == 'application/json; charset=utf-8')
                                {
                                    new Promise((resolve,reject) => {
                                        setResponse(index,response,function(){
                                            totalRes++
                                            resolve()
                                            .then(err=>{
                                                logger.log({
                                                    level: 'error',
                                                    log : 'GET request error'
                                                  });
                                            })
                                        })
                                    })
                                } else  {
                                    logger.log({
                                        level: 'error',
                                        log : 'Response is not a API response'
                                      });
                                    process.exit();
                                }
                           })
                           .catch(err => {
                               logger.log({
                                    level: 'error',
                                    log : 'GET request error'
                              });
                           })
                        break;
                    }
                    case 'delete': {
                        setRequest(index,reqParam);
                        totalReq++
                        axios.delete(baseUrl+apiPath+apiParam)
                            .then((response)=> {
                                if(response.headers['content-type']  == 'application/json; charset=utf-8')
                                {
                                    new Promise((resolve,reject) => {
                                        setResponse(index,response,function(dta){
                                            totalRes++
                                            resolve()
                                            .then(err =>{
                                                logger.log({
                                                    level: 'error',                                    
                                                    log : 'DELETE request error'
                                                  });
                                            })
                                        })
                                    })
                                } else  {
                                    logger.log({
                                        level: 'error',
                                        log : 'Response is not a API response'
                                      });
                                    process.exit();
                                }
                            })
                            .catch(err => {
                                logger.log({
                                    level: 'error',                                    
                                    log : 'DELETE request error'
                                  });
                            })
                        break;
                    }
                    case 'put':{
                        setRequest(index,reqParam);
                        totalReq++
                        axios.put(baseUrl+apiPath,apiParam)
                            .then((response)=> {
                                if(response.headers['content-type']  == 'application/json; charset=utf-8')
                                {
                                    new Promise((resolve,reject) => {
                                        setResponse(index,response,function(){
                                            totalRes++
                                            resolve()
                                            .then(err =>{
                                                logger.log({
                                                    level: 'error',                                    
                                                    log : 'PUT request error'
                                                  });
                                            })
                                        })
                                    })
                                } else  {
                                    logger.log({
                                        level: 'error',
                                        log : 'Response is not a API response'
                                      });
                                    process.exit();
                                }
                            })
                            .catch(err => {
                                logger.log({
                                    level: 'error',                                
                                    log : 'PUT request error'
                                  });
                            })
                        break;
                    }
                    case 'post':{
                        setRequest(index,reqParam);
                        totalReq++
                        axios.post(baseUrl+apiPath,apiParam)
                            .then((response)=> {
                                if(response.headers['content-type']  == 'application/json; charset=utf-8')
                                {
                                    new Promise((resolve,reject) => {
                                        setResponse(index,response,function(){
                                            totalRes++
                                            resolve()
                                            .then(err =>{
                                                logger.log({
                                                    level: 'error',                                    
                                                    log : 'POST request error'
                                                  });
                                            })
                                        })
                                    })
                                } else  {
                                    logger.log({
                                        level: 'error',
                                        log : 'Response is not a API response'
                                      });
                                    process.exit();
                                }
                            })
                            .catch(err => {
                                logger.log({
                                    level: 'error',                                
                                    log : 'POST request error'
                                  });
                            })
                        break;
                    }

                    default:
                    logger.log({
                        level: 'info',
                        message: "method type not matched"
                      });
                }
            } else {
        
                cmd.run('rm -rf ./doc')

                if(apiValue.name != '')
                {
                    logger.log({
                        level: 'error',
                        log: 'API request method is missing in your annotation.'
                      });
                    process.exit();
                } else {
                    if(totalReq === 0 && totalRes === 0)
                    checkForCallback(1,1);
                }
            }

            callback();

        },function(err) {
            if(err){
                logger.log({
                    level: 'error',                
                    log : err
                });
            }

            console.log('Iterating done 80%');
            
        });
            // check for apiCaller callback
            function checkForCallback(totalReq,totalRes) {
               if(totalReq !== 0 && totalRes !== 0)
               {
                   if(totalReq === totalRes)
                   callback()
               }
               
               if(totalReq !== totalRes)
                 setTimeout(checkForCallback, 1000);
            }
            checkForCallback(totalReq,totalRes);
    }

     // Creating Body Parameter
    createApiBodyParam = (apiValue,temp,skip,callback) => {
        Date.prototype.getCurrentTime = function(){
            return ((this.getHours() < 10)?"0":"") + ((this.getHours()>12)?(this.getHours()-12):this.getHours()) +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds() + ((this.getHours()>12)?(' PM'):' AM');
            };
            
            var today = new Date(); //date object
            var current_date = today.getDate();
            var current_month = today.getMonth()+1; //Month starts from 0
            var current_year = today.getFullYear();
            var current_time = today.getCurrentTime();
            var currentDateTime = current_date+"/"+current_month+"/"+current_year+''+current_time


        apiValue.parameter.fields.Parameter.map((paramValue,index) => {
            var randInt = apiInt[Math.floor(Math.random() * apiInt.length)];
            var randString = apiString[Math.floor(Math.random() * apiString.length)];
            var randBool = apiBool[Math.floor(Math.random() * apiBool.length)];
            var randFloot = apiFloot[Math.floor(Math.random() * apiFloot.length)];
            
            if(skip === null)
            {
                switch(paramValue.type) 
                {
                    case 'String' : {
                        temp.push({[paramValue.field] : randString})
                        break;
                    }
                    case 'id': {
                        temp.push({[paramValue.field] : randInt})
                        break;
                    }
                    case 'Number': {
                        temp.push({[paramValue.field] : randInt})
                        break;
                    }
                    case 'Boolean' : {
                        temp.push({[paramValue.field] : randBool})
                        break;
                    }
                    case 'Floot' : {
                        temp.push({[paramValue.field] : randFloot})
                        break;
                    }
                    case 'Date' : {
                        temp.push({[paramValue.field] : currentDateTime})
                        break;
                    }
                    default :
                    logger.log({
                        level: 'info',
                        message: "datatype not matched"
                    });
                }
            }
            else {
                if(skip <= index)
                {
                    switch(paramValue.type) 
                {
                    case 'String' : {
                        temp.push({[paramValue.field] : randString})
                        break;
                    }
                    case 'id': {
                        temp.push({[paramValue.field] : randInt})
                        break;
                    }
                    case 'Number': {
                        temp.push({[paramValue.field] : randInt})
                        break;
                    }
                    case 'Boolean' : {
                        temp.push({[paramValue.field] : randBool})
                        break;
                    }
                    case 'Floot' : {
                        temp.push({[paramValue.field] : randFloot})
                        break;
                    }
                    case 'Date' : {
                        temp.push({[paramValue.field] : currentDateTime})
                        break;
                    }
                    default :
                    logger.log({
                        level: 'info',
                        message: "datatype not matched"
                    });
                }
                }
            }
            
        })

        callback(temp);
    }

    // Set response value in the API objects
    setRequest = (index,value) => {
        json_arr.map(item => {
            if(item.id === index)
            {
               item.request = value;
            }
        })
    }

    // Set response value in the API objects
    setResponse = (index,res,callback) => {
        json_arr.map(item => {
            if(item.id === index)
            {
               apiResponse = {status : {code : res.status,text : res.statusText}, data : res.data}
               item.response = apiResponse;
            }
        })
        callback()
    }

    // Create an Html data of the Json Object
    createHtmlArt = (callback) => {
        jsonResult = ''
        json_arr.map(value => {

            var paramsResult = ''  // Final table result of all parameters input
            if(value.parameter !== undefined)
            {
                var tempParam = value.parameter
                var paramObjName = 'Parameter'     // Default Title of Parameters
                var tempFields = tempParam[Object.keys(tempParam)[0]]
                paramObjName = Object.keys(tempFields)[0]  // Assign title of Parameters
                var tempObj = tempFields[Object.keys(tempFields)[0]]
                var jsonParams = '';
                tempObj.map((paramValue)=> {
                    jsonParams = jsonParams + `<tr><td class="code">${paramValue.field}</td><td>${paramValue.type}</td><td><p>${paramValue.description}</p></td></tr>`
                    return null;
                })


                // Parameters table layout
                paramsResult = `<h2>${paramObjName}</h2>
                                <table>
                                <thead>
                                    <tr>
                                    <th style="width: 30%">Field</th>
                                    <th style="width: 10%">Type</th>
                                    <th style="width: 60%">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${jsonParams}
                                </tbody>
                                </table>`
            }

            var successResult = ''  // Final table result of all sucess output
            if(value.success !== undefined)
            {
                var tempSuccess = value.success
                var isFeilds = Object.keys(tempSuccess)[0]
                var successObjName = 'Success' // Default title of success
                var finalresult = ''       // Final success result
                if(isFeilds == 'fields')
                {
                    var tempSuccessFeilds = tempSuccess[Object.keys(tempSuccess)[0]]
                    successObjName = Object.keys(tempSuccessFeilds)[0]     // Assign title of success
                    var tempSuccessObj = tempSuccessFeilds[Object.keys(tempSuccessFeilds)[0]]
                    
                    // Fetch all the values of success table
                    var jsonSuccessParam = '';
                    tempSuccessObj.map((paramValue)=> {
                        jsonSuccessParam = jsonSuccessParam + `<tr><td class="code">${paramValue.field}</td><td>${paramValue.type}</td><td><p>${paramValue.description}</p></td></tr>`
                        return null;
                    })
                    
                    // Success table layout
                    finalresult = `<h2>${successObjName}</h2>
                                    <table>
                                    <thead><tr><th style="width: 30%">Field</th><th style="width: 10%">Type</th><th style="width: 60%">Description</th></tr></thead>
                                    <tbody>${jsonSuccessParam}</tbody></table>`
                }
                successResult = finalresult    // Assign "finalresult" in "successresult"
                
            }

            var requestResult = ''; // It store final output of the request
            if(Object.keys(value.request).length !== 0 && value.request.constructor === Object)
            {
                var reqParam = Object.keys(value.request).map((reqVal,i)=>{
                    var br = ''
                    if(i > 0)
                    br = '\n'
                    var isFeilds = Object.keys(value.request)[i]
                    if(isFeilds === 'params' || isFeilds === 'body')
                    {
                        var tempRequest = value.request;
                        var tempRequestFeilds = tempRequest[Object.keys(tempRequest)[i]]
                       
                        return `${br}${' '}${' '}</span><span class="str">"${isFeilds}"</span><span class="pun">:</span><span class="pln"> </span><span class="str">${JSON.stringify(tempRequestFeilds)}</span><span class="pln">`                  
                    } 
                    if(isFeilds !== 'params' || isFeilds !== 'body')
                    {
                        return `${br}${' '}${' '}</span><span class="str">"${Object.keys(value.request)[i]}"</span><span class="pun">:</span><span class="pln"> </span><span class="str">"${value.request[reqVal]}"</span><span class="pln">`
                    }
                })


                requestResult = `<ul class="nav nav-tabs nav-tabs-examples">
                        <li class="active">
                        <h2>Request</h2>
                        </li>
                    </ul>
                        <div class="tab-content">
                        <div class="tab-pane active" id="request-examples-${value.group}-${value.name}-${value.version}">
                        <pre class="prettyprint language-json prettyprinted" data-type="${value.type}" style=""><code><span class="pun">{</span><span class="pln">
${reqParam}
</span><span class="pun">}</span></code></pre>
                        </div>
                    </div>`
            }

            var responseResult = '';    // It store final output of the response
            if(value.response !== undefined)
            {
                if(Object.keys(value.response).length !== 0 && value.response.constructor === Object)
                {
                    var resParam = Object.keys(value.response.data).map((reqVal,i)=>{
                        var br = ''
                        if(i > 0)
                        br = '\n'

                        return `${br}${' '}${' '}</span><span class="str">"${Object.keys(value.response.data)[i]}"</span><span class="pun">:</span><span class="pln"> </span><span class="str">"${value.response.data[reqVal]}"</span><span class="pln">`
                    })


                    responseResult = `<ul class="nav nav-tabs nav-tabs-examples">
                            <li class="active">
                            <h2>Response</h2>
                            </li>
                        </ul>
                            <div class="tab-content">
                            <div class="tab-pane active" id="response-examples-${value.group}-${value.name}-${value.version}">
                            <pre class="prettyprint language-json prettyprinted" data-type="${value.type}"><code><span class="pln">HTTP</span><span class="pun"> </span><span class="pun">Status</span><span class="pln"> </span><span class="lit">${value.response.status.code}</span><span class="pln"> ${value.response.status.text}
        </span>\n<span class="pun">{</span><span class="pln">
${resParam}
</span><span class="pun">}</span></code></pre>
                            </div>
                        </div>`
                }
            }
            
            jsonResult = jsonResult + `<article id="api-${value.group}-${value.name}" data-group="${value.group}" data-name="${value.name}" data-version="${value.version}">
            <div class="pull-left">
              <h1>${value.group} - ${value.title}</h1>
            </div>

            <div class="clearfix"></div>
        
        
            <span class="type type__${value.type}">${value.type}</span>
            <pre class="prettyprint language-html prettyprinted" data-type="${value.type}" ><code><span class="pln">${value.url}</span></code></pre>
        
            ${paramsResult}   
            
            ${successResult}

            ${requestResult}
            
            ${responseResult}

          </article>`
          return null;
        })
    // console.log(jsonResult)
        callback()
    }

    // Build the Html document file in "api_doc" folder
    buildHtml = () => {
        var currentDT = new Date().toDateString();  //Current date

        // concatenate header string
        var header = '<meta http-equiv="X-UA-Compatible" content="IE=edge" />'
        header += '<title>Loading...</title>'
        header += '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        header += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
        header += '<link href="css/bootstrap.min.css" rel="stylesheet" media="screen">'
        header += '<link href="css/prettify.css" rel="stylesheet" media="screen">'
        header += '<link href="css/style.css" rel="stylesheet" media="screen, print">'
        header += '<link href="img/favicon.ico" rel="icon" type="image/x-icon">';

         // concatenate body string
        var body = '<div class="container-fluid">'
        body += '<div class="row">'
        body += '<div id="content">'
        body += '<div id="project">'
        body += '<div class="pull-left">'
        body += '<h1>APIs Documentation</h1>'
        body += '</div>'
        body += '<div class="clearfix"></div>'
        body += '</div>'
        body += '<div id="sections">'
        body += jsonResult
        body += '</div>'
        body += '<div id="generator">'
        body += '<div class="content">'
        body += 'Hestabit 0.0.1 -'
        body += currentDT
        body += '</div>'
        body += '</div></div></div></div>';
      
        return '<!DOCTYPE html>'
             + '<html><head>' + header + '</head><body>' + body + '</body></html>';
      };

      createPdf = (callback) => {
        phantom.create().then(function (instance) {
            instance.createPage().then(function (page) {
                page.property('paperSize', {
                    format: 'A4',
                });
                var fileName = './node_modules/node-api-doc-generator/api_doc/document.html';
                fs.access(fileName, fs.constants.F_OK, (err) => {
                    // console.log(`${fileName} ${err ? 'does not exist' : 'exists'}`);
                    if(!err)
                    {
                        page.open(fileName).then(function (status) {
                            console.log(`Page opened with status [${status}]. 90%`);
                            setTimeout(function () {
                                page.render("./api_document.pdf").then(function () {
                                    console.log(`File created at [./api_document.pdf] 100%`);
                                    callback();
                                    instance.exit();
                                });
                            }, 5000);
                        })
                        .catch(err => {
                            logger.log({
                                level: 'error',                        
                                log : err
                              });
                        })
                    } else {
                        logger.log({
                            level: 'error',
                            message: 'File "document.html" is missing at "./node_modules/node-api-doc-generator/api_doc" dir',
                            log : err
                          });
                    }
                });
            });
        });
    }

    // APIs Document Generator API
    app.get('/api/document',(req,res) => {

        async.series([
            function(callback){
                console.log("Initilizing configration 0%")
                var file = '/doc/api_data.json'
                fs.access(file, fs.constants.F_OK, (err) => {
                    if(err){
                        cmd.get(
                            'apidoc -e node_modules',
                            function(err, data, stderr){
                                if (!err) {
                                    console.log("Setup project completed 30%")
                                    callback()
                                } else {
                                    logger.log({
                                        private: true,
                                        level: 'error',                        
                                        log : err
                                    });
                                }
                            }
                        );
                    } else {
                        cmd.get(
                            'apidoc -e node_modules',
                            function(err, data, stderr){
                                callback();
                            }
                        );
                    }
                })
            },
            function(callback){
                fs.exists('./node_modules/node-api-doc-generator/api_doc', function(exists) {
                    if(exists == false)
                    {                        
                        cmd.get(
                            'mkdir node_modules/node-api-doc-generator/api_doc',
                            function(err, data, stderr){
                                if (!err) {
                                    cmd.get(
                                        'touch ./node_modules/node-api-doc-generator/api_doc/document.html',
                                        function(err, data, stderr){
                                            console.log("Setup project completed 50%")
                                            callback()
                                        }
                                    );
                                } else {
                                    logger.log({
                                        private: true,
                                        level: 'error',                        
                                        log : err
                                    });
                                }
                            }
                        );
                        
                    } else {
                        var fileName = './node_modules/node-api-doc-generator/api_doc/document.html';
                        fs.access(fileName, fs.constants.F_OK, (err) => {
                            if(err){
                                cmd.get(
                                    'touch ./node_modules/node-api-doc-generator/api_doc/document.html',
                                    function(err, data, stderr){
                                        callback()
                                    }
                                );
                            } else {
                                callback()
                            }
                        })
                    }
                });
                
            },
            function(callback) {
              console.log("Setup Completed 60%")
            var file = './doc/api_data.json'
            // Check if the file exists in the current directory.
            fs.access(file, fs.constants.F_OK, (err) => {
                // console.log(`${file} ${err ? 'does not exist' : 'exists'}`);
                if(!err)
                {
                    const apiData = require('../../doc/api_data.json')
                    apiCaller(apiData,function(){
                        callback();
                    });
                } else {
                    logger.log({
                        level: 'warn',   
                        message: 'Run "npm install apidoc -g" and then run "apidoc -e node_modules/" at your terminal',                 
                        log : err
                      });
                }
            });
              
            },
            function(callback){
              createHtmlArt(function(){
                callback();
              }); 
            },
            function(callback) {
                var fileName = './node_modules/node-api-doc-generator/api_doc/document.html';
                fs.access(fileName, fs.constants.F_OK, (err) => {
                    // console.log(`${fileName} ${err ? 'does not exist' : 'exists'}`);
                    if(!err)
                    {
                        var stream = fs.createWriteStream(fileName);

                        stream.once('open', function(fd) {
                        var html = buildHtml();
            
                        stream.end(html);
                        });
                        callback();
                    } else {
                        logger.log({
                            level: 'error',
                            message: 'File "document.html" is missing at "./node_modules/node-api-doc-generator/api_doc" dir',                     
                            log : err
                          });
                        
                    }
                });
                
            },
            function(callback){
                createPdf(function(){
                    callback();
                })
            }
        ],
        // optional callback
        function(err, results) {
          if(err){
              logger.log({
                level: 'error',
                
                log : err
              });
              var data = {
                    status : 400,
                    error : true,
                    message : err.message,
                    data : []
                }
              res.status(400).send(data)
          } else {
            var data = {
                status : 200,
                error : false,
                message : 'File created at [./api_document.pdf]',
                data : []
            }
            res.status(200).send(data)
          }       
        });
        

    })
}