import React, { Component, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter,
} from 'react-router-dom';

////////////////////////////////////////////////////////////
// 1. Click the public page
// 2. Click the protected page
// 3. Input username
// 4. Log in
// 5. Click the back button, note the URL each time

function App() {
  return (
    <Router>
      <div>
        <AuthButton />
        <ul>
          <li>
            <Link to="/public">Public Page</Link>
          </li>
          <li>
            <Link to="/protected">Protected Page</Link>
          </li>
        </ul>
        <Route path="/public" component={Public} />
        <Route path="/login" component={Login} />
        <PrivateRoute path="/protected" component={Protected} />
      </div>
    </Router>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  username: null,
  async authenticate(username) {
    if (!username) {
      await Promise.reject("username can't be empty!");
    }

    this.isAuthenticated = true;
    this.username = username;

    await Promise.resolve();
  },
  async signout() {
    this.isAuthenticated = false;
    this.username = null;

    await Promise.resolve();
  },
};

const AuthButton = withRouter(({ history }) =>
  fakeAuth.isAuthenticated ? (
    <p>
      Welcome!{fakeAuth.username}
      <button
        onClick={async () => {
          await fakeAuth.signout();
          history.push('/');
        }}
      >
        Sign out
      </button>
    </p>
  ) : (
    <p>You are not logged in.</p>
  )
);

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        fakeAuth.isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
}

function Public() {
  return <h3>Public</h3>;
}

function Protected() {
  return <h3>Protected</h3>;
}

function Login(props) {
  const [redirectToReferrer, setRedirectToReferrer] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { from } = props.location.state || { from: { pathname: '/' } };

  const login = async () => {
    try {
      await fakeAuth.authenticate(username);
    } catch (err) {
      setError(err);
      return;
    }

    setRedirectToReferrer(true);
  };

  if (redirectToReferrer) {
    return (
      <Redirect
        to={{
          pathname: from.pathname,
        }}
      />
    );
  }

  return (
    <div>
      <p>You must log in to view the page at {from.pathname}</p>
      <input
        placeholder="username"
        type="text"
        value={username}
        onInput={event => setUsername(event.target.value)}
      />
      <button onClick={login}>Log in</button>
      <p>{error}</p>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
