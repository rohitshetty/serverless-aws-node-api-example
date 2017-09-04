This is an example serverless project intended to be run on AWS Lambda.

Steps to run

0. create env.json file following example.env.json file.
1. `npm install`
2. configure your serverless [cli](https://github.com/serverless/serverless)
3. sls deploy

This project is an example demo on how to create REST Endpoints using Serverless framework.
Here two APIs are exposed
* GET /users
* POST /users

POST /users creates a user object. This has data validation. The user object should contain name, email and mobileNumber parameter. There is no authentication implemented yet. But can be easily done using AWS custom authorizers.

GET /users lists all the users and details. If you pass either of name, email or mobileNumber with values only users matching those will be returned.

This project uses PostgresSQL. and pg node module. I have used no ORM just to reduce the schema management. But if needed Sequelize or other ORMs can be used(ofcourse with tradeoffs).