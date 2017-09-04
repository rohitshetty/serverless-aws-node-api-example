'use strict';

const Joi = require('joi');
const { Client } = require('pg');
const inputValidators = (body) => {
  /*
    Validate the user input
    We are using Joi
  */
  const userSchemaForValidation = {
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobileNumber: Joi.number().required()
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



module.exports.createUser = (event, context, callback) => {
  //This wont wait for event loop to be empty. Useful when using heavy libraries like sequelize. Speeds things up.
  context.callbackWaitsForEmptyEventLoop = false;
  const body = JSON.parse(event.body) || {};

  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432
  });

  inputValidators(body) //validate user input
    .then(() => {
      return client.connect();
    })
    .then(() => {
      const query = 'insert into users(name, email, mobile) values ($1, $2, $3)';
      const values = [body.name, body.email, body.mobileNumber];

      return client.query(query, values);
    })
    .then((res) => {
      this.users = res.rows;
      return client.end();
    })
    .then(() => {

      const response = {
        statusCode: 201
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
