# APIs Documentation

> This API will read annotations of the project APIs and create a PDF document with there Request and Response.
## Installation

> **Step 1:**
> Run `npm install apidoc -g` in your terminal (It will install `apidoc` in your system globally)

```sh
$ npm install apidoc -g
```

> **Step 2:**
> Install `node-api-doc-generator`

```sh
$ npm install node-api-doc-generator
```

> **Step 3:**
> Required `node-api-doc-generator` in your app.js / index.js (entry point) or into your routes file and provide the `app`, `hostname`, `port` as in parameter.
```sh
const nodeApiDocGenerator = require('node-api-doc-generator')
nodeApiDocGenerator(app,'hostname',port)

or 

require('node-api-doc-generator')(app,'hostname',port);
```

> **Step 4 :**
> Finaly start your server and hit `/api/document` in your browser to generate the APIs document. (It will create a new document at your root directory with the name **api_document.pdf**.)

--

---

### How it works
- It read all the mentioned annotations of the APIs
- Then it calls all the APIs (which contain their annotations according to [*apidoc*](http://apidocjs.com/)) and provides the random input as per API requirement.
- Then it stores the request (Input) and the response (Output) of each API.
- Finally, it creates the PDF  documentation of APIs which contain -
`apiName`, `apiMethod`, `apiUrl`, `apiDescription`, `apiParams`,`apiSuccess`,`apiRequest`,`apiResponse`

## Conditions

  - It only works if you mention annotations of API.
  - Annotations should be according to "**apidoc**" for more details visit the official site of [**apidoc**](http://apidocjs.com/)
  - It supports `GET`, `POST`, `PUT` and `DELETE ` method.
 
 --
 
 ---
 
## Annotations
> Minimum annotation required by the API is given below -

```sh
/**
 * @api {get} /user/:id Request User information
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiParam {Number} id Users unique ID.
 *
 * @apiSuccess {String} firstname Firstname of the User.
 * @apiSuccess {String} lastname  Lastname of the User.
 */
```
### Explanation
#### @api
```sh
@api {method} path [title]
```
**Required!**

> Without that indicator, apiDoc parser ignore the documentation block.
The only exception are documentation blocks defined by  `@apiDefine`, they not required `@api`.

 Usage:` @api {get} /user/:id Users unique ID.`
| Name | Description |
| ------ | ------ |
| method | Request method name: DELETE, GET, POST, PUT|
| path | Request Path.|
| title | A short title. (used for navigation and article header)|

#### Example:
```sh
/**
 * @api {get} /user/:id
 */
```

#### @apiName
```sh
@apiName name
```
**Should always be used.**

> Defines the name of the method documentation block. Names will be used for the Sub-Navigation in the generated output. Structure definition not need  `@apiName`.

 Usage:` @apiName GetUser`
| Name | Description |
| ------ | ------ |
| name | Unique name of the method. Format: method + path (e.g. Get + User), only a proposal, you can name as you want. Also used as navigation title.|

#### Example:
```sh
/**
 * @api {get} /user/:id
 * @apiName GetUser
 */
```

#### @apiGroup
```sh
@apiGroup name
```
 **Should always be used.**
> Defines to which group the method documentation block belongs. Groups will be used for the Main-Navigation in the generated output. Structure definition not need `@apiGroup`.

 Usage:` @apiGroup User`
| Name | Description |
| ------ | ------ |
| name | Name of the group. Also used as navigation title.|

#### Example:
```sh
/**
 * @api {get} /user/:id
 * @apiGroup User
 */
```

#### @apiParam
```sh
@apiParam [(group)] [{type}] [field=defaultValue] [description]
```
> Describe a parameter passed to you API-Method.

 Usage:` apiParam (MyGroup) {Number} id Users unique ID.`
| Name | Description |
| ------ | ------ |
| (group)  optional | All parameters will be grouped by this name. Without a group, the default `Parameter` is set. You can set a title and description with `@apiDefine.`|
| {type} | Parameter type, e.g. `{Boolean}`, `{Number}`, `{String}`, `{Object}`, `{String[]}` (array of strings), ...|
| field | Variablename.|
| [field] | Fieldname with brackets define the Variable as optional.|
| =defaultValue optional | The parameters default value.|
| description | Description of the field.|

#### Example:
```sh
/**
 * @api {get} /user/:id
 * @apiParam {Number} id Users unique ID.
 */
 
 /**
 * @api {post} /user/
 * @apiParam {String} [firstname]  Optional Firstname of the User.
 * @apiParam {String} lastname     Mandatory Lastname.
 * @apiParam {String} country="DE" Mandatory with default value "DE".
 * @apiParam {Number} [age=18]     Optional Age with default 18.
  */
```

#### @apiSuccess
```sh
@apiSuccess [(group)] [{type}] field [description]
```
> Success return Parameter.

 Usage:`@apiSuccess {String} firstname Firstname of the User.`
| Name | Description |
| ------ | ------ |
| (group)  optional | All parameters will be grouped by this name. Without a group, the default `Success 200` is set. You can set a title and description with @apiDefine.|
| {type} | Parameter type, e.g. `{Boolean}`, `{Number}`, `{String}`, `{Object}`, `{String[]}` (array of strings), ...|
| field | 	Return Identifier (returned success code).|
| description | Description of the field.|

#### Example:
```sh
/**
 * @api {get} /user/:id
 * @apiSuccess {String} firstname Firstname of the User.
 * @apiSuccess {String} lastname  Lastname of the User.
 */
```

## Errors

> We create a `error.log` file at the root folder of the project.



   