/***
*
*   SETUP DATABASE
*   Populates the database tables for your application.
*
**********/

import { Fragment, useState, useEffect } from 'react';
import { Form, Row, Alert, Loader, useAPI } from 'components/lib';

export function SetupDatabase() {

  const res = useAPI('/api/setup/database');
  const conn = res.data?.connection;

  const sql = {
    host: {
      label: 'Host',
      type: 'text',
      required: true,
      errorMessage: 'Please enter a database host'
    },
    user: {
      label: 'User',
      type: 'text',
      required: true,
      errorMessage: 'Please enter your database username'
    },
    password: {
      label: 'Password',
      type: 'password',
      errorMessage: 'Please enter your database password'
    },
    port: {
      label: 'Port',
      type: 'number',
      required: true,
      errorMessage: 'Please enter your database port'
    },
    database: {
      label: 'Database Name',
      type: 'text',
      required: true,
      errorMessage: 'Please provide your database name'
    }
  }

  const sqlLite = {
    filename: {
      type: 'text',
      label: 'Filename',
      placeholder: './gravity.sqlite',
      required: true,
    }
  }

  // state
  const [form, setForm] = useState({ ...{

    client: {
      label: 'Client',
      type: 'select',
      defaultValue: 'mysql2',
      required: true,
      options: [
        { value: 'mysql2', label: 'MySQL' },
        { value: 'mongo', label: 'MongoDB' },
        { value: 'pg', label: 'Postgres' },
        { value: 'sqlite3', label: 'Sqlite3' },
        { value: 'mssql', label: 'MSSQL' },
        { value: 'oracledb', label: 'Oracle DB' },
      ],
      errorMessage: 'Please select a database client'
    }
  }, ...sql });

  function update(udata){

    if (udata.input === 'client' && udata.value === 'sqlite3'){

      let database = {...form };
      Object.keys(database).map(key => key !== 'client' && delete database[key]);
      setForm({ ...database, ...sqlLite });

    }
    else if (udata.input === 'client'){

      let database = {...form, ...sql }
      Object.keys(conn).map(key => { return database[key].value = conn[key] });
      if (udata.value === 'mongo') delete database.port;
      delete database.filename;
      setForm(database);

    }
  }

  useEffect(() => {

    // if populate inital values
    if (res?.data){
      if (conn && conn.host && form.host && !form.host.value){

        const f = {...form };            
        Object.keys(conn).map(key => { return f[key].value = conn[key] });
        if (res.data.client === 'mongo') delete f.port;
        f.client.default = res.data.client;
        setForm(f);

      }
    }
  }, [conn, form, res.data]);

  if (res.loading)
    return <Loader />

  return(

    <Fragment>
    
      <Row>
        <Alert 
          variant='info'
          description='Need help? Refer to the database docs'
          button={{

            text: 'Open Docs',
            url: 'https://docs.usegravity.app/gravity-server/installation/database-setup',

          }}
        />
       </Row>

      <Form
        inputs={ form }
        url='/api/setup/database'
        method='POST'
        onChange={ update }
        buttonText='Connect to Database'
      />

    </Fragment>
  );
}
