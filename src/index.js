import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter,
} from 'react-router-dom';
import delay from 'delay';
import { Random } from 'mockjs';

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
  isAuthenticated: null,
  username: null,
  status: {
    LOGIN: Symbol(),
    NOT_LOGIN: Symbol(),
  },
  async checkLoginStatus() {
    const { LOGIN, NOT_LOGIN } = this.status;

    if (this.isAuthenticated) {
      return LOGIN;
    } else if (this.isAuthenticated !== null) {
      return NOT_LOGIN;
    }

    await delay(Random.integer(0.5e3, 2e3));

    if (Random.boolean()) {
      this.signin(Random.name());
      return LOGIN;
    }

    this.isAuthenticated = false;
    return NOT_LOGIN;
  },
  async authenticate(username) {
    if (!username) {
      return Promise.reject("username can't be empty!");
    }

    await delay(Random.integer(0.5e3, 2e3));

    if (Random.boolean()) {
      this.signin(username);
    } else {
      return Promise.reject(Random.sentence());
    }
  },
  signin(username) {
    this.isAuthenticated = true;
    this.username = username;
  },
  async signout() {
    await delay(Random.integer(0.5e3, 2e3));

    this.isAuthenticated = false;
    this.username = null;
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
  const [isChecking, setIsChecking] = useState(
    fakeAuth.isAuthenticated === null
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const { from } = props.location.state || { from: { pathname: '/' } };

  useEffect(() => {
    (async () => {
      if (fakeAuth.isAuthenticated !== null) {
        return;
      }

      const loginStatus = await fakeAuth.checkLoginStatus();

      if (loginStatus === fakeAuth.status.LOGIN) {
        setRedirectToReferrer(true);
      }

      setIsChecking(false);
    })();

    return () => {};
  }, []);

  const login = useCallback(
    async event => {
      event.preventDefault();
      setError(null);
      setIsAuthenticating(true);

      try {
        await fakeAuth.authenticate(username);
      } catch (err) {
        setError(err);
        return;
      } finally {
        setIsAuthenticating(false);
      }

      setRedirectToReferrer(true);
    },
    [username]
  );

  if (redirectToReferrer) {
    return (
      <Redirect
        to={{
          pathname: from.pathname,
        }}
      />
    );
  }

  if (isChecking) {
    return <p>Checking</p>;
  }

  return (
    <div>
      <p>You must log in to view the page at {from.pathname}</p>
      <form onSubmit={login}>
        <input
          placeholder="username"
          type="text"
          value={username}
          disabled={isAuthenticating}
          onChange={event => setUsername(event.target.value)}
        />
        <button disabled={isAuthenticating} type="submit">
          Log in
        </button>
        <p>{error ? `Oops: ${error}` : ''}</p>
      </form>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
