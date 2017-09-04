'use strict';

const Joi = require('joi');
const { Client } = require('pg');
const inputValidators = (body) => {

  //Here the members are not required they are optional
  const userSchemaForValidation = {
    name: Joi.string(),
    email: Joi.string().email(),
    mobileNumber: Joi.number()
  };


  //We will promisify this code, although the code is syncro just to structure the main code in one chain
  /*
    example:
      validator(body)
        .then(..)
        .then(..)
        .catch(..)

        validator emits error object with statusCode and message parameters. statusCode is sent to user

    This helps to minimise code and have a single error handler
  */

  return new Promise((resolve, reject) => {
    
    const result = Joi.validate(body, userSchemaForValidation, {
      abortEarly: false //Shows all the error in input and doesnt fail on first error, useful for api consumers
    });

    if (result.error) {
      return reject({
        statusCode: 400,
        message: result.error.details
      });
    }

    return resolve();

  });
};


const queryConstructor = (body) => {
  let query = 'select * from users'; //base query
  const values = [];

  if (body.name || body.email || body.mobileNumber) {
    query = `${query} where`; //select * from users where

    if (body.name) {
      values.push(`%${body.name}%`);
      const valueLength = values.length;
      query = `${query} name like $${valueLength}`; // select * from users where name like "%name%"
    }

    if (body.email) {
      values.push(`%${body.email}%`);
      const valueLength = values.length;
      // select * from users where name like "%name%" AND email like "%email%"
      // if the only parameter then
      //select * from users where email like "%email%"
      query = valueLength > 1 ? `${query} AND email like $${valueLength}` : `${query} email like $${valueLength}`;
    }

    if (body.mobileNumber) {
      values.push(`%${body.mobileNumber}%`);
      const valueLength = values.length;
      query = valueLength > 1 ? `${query} AND mobile like $${valueLength}` : `${query} mobile like $${valueLength}`;
    }

  }

  return {
    query: query, 
    values: values
  };
};


module.exports.listUsers = (event, context, callback) => {
  //This wont wait for event loop to be empty. Useful when using heavy libraries like sequelize. Speeds things up.
  context.callbackWaitsForEmptyEventLoop = false;
  const body = JSON.parse(JSON.stringify(event.queryStringParameters || {}));

  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
  });

  inputValidators(body)
    .then(() => {
      return client.connect();
    })
    .then(() => {
      
      const query = queryConstructor(body);
      return client.query(query.query, query.values);
    })
    .then((res) => {
      this.users = res.rows;
      return client.end();
    })
    .then(() => {

      const response = {
        statusCode: 201,
        body: JSON.stringify({ // body always should be JSON.stringified
          users: this.users
        })
      };

      callback(null, response);
    })
    .catch(err => {

      console.error(err);

      const response = {
        statusCode: err.statusCode || 500,
        body: JSON.stringify(err.message || 'Internal server error')
      };

      callback(null, response);
    });

};
