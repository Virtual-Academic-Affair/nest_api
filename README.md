## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

Additionally this projects adds the following functionality:

- User authentication with JWT
- User registration with Google
- Custom decorator for role-based authorization
- Custom decorator to make resources public/private
- Custom user context decorator

## Project Structure

The project is organized into two main modules:

- **`authentication/`**: Contains authentication-related functionality
  - `controllers/`: Authentication controllers (Google OAuth, Users)
  - `services/`: Authentication services (AuthenticationService, GoogleAuthenticationService, UsersService)
  - `entities/`: User entity
  - `dto/`: Data transfer objects for authentication

- **`shared/`**: Contains shared utilities and common functionality
  - `authentication/`: Authentication guards and decorators
  - `authorization/`: Authorization guards, decorators, and role enums
  - `config/`: JWT configuration
  - `decorators/`: Common decorators (ActiveUser)
  - `hashing/`: Password hashing services
  - `interfaces/`: Shared interfaces (ActiveUserData)

## Tech stack

- [NestJS](https://nestjs.com/) as framework
- [TypeORM](https://typeorm.io/#/) as ORM
- [Docker](https://www.docker.com/) for containerization
- [PostgreSQL](https://www.postgresql.org/) as database
- [Swagger](https://swagger.io/) for API documentation
- [JWT](https://jwt.io/) for authorization

## How to

### Enforce auth on a route

You can use the `@Auth()` decorator to enforce authentication on a route. This will check if the user is authenticated
and if the user has a valid JWT token. If the user is not authenticated or the JWT token is invalid, a
`401 Unauthorized` response will be returned.

-`AuthType.None`: Makes a route public

-`AuthType.Bearer`: Required the `Authorization: Bearer <token>` header

```typescript
@Auth(AuthType.Bearer)
@Auth(AuthType.None)
```

### Role based authorization

You can use the `Roles()` decorator to enforce role based authorization on a route. This will check if the user has the
required role. If the user does not have the required role, a `403 Forbidden` response will be returned.

Three roles are supported: `Role.Student`, `Role.Admin`, and `Role.Lecture`. You can use the decorator multiple times to require multiple
roles. You can add more roles in the `src/shared/authorization/enums/role.enum.ts` file.

```typescript
@Roles(Role.Student)
@Roles(Role.Admin)
@Roles(Role.Lecture)
```

### Accessing the active user

You can use the `@ActiveUser()` decorator to access the active user. This will return the user object of the
authenticated user.

```typescript
@ActiveUser() activeUser: ActiveUserData
```

### General

- Both the `@Auth()` and `@Roles()` decorators can be used on the same route.
- Both decorators can be used on a controller or route level. You can also make the whole controller private and
  override one route to make it public.

## Documentation

```bash
http://localhost:3000/api
```

## Installation

```bash
$ npm install
$ docker-compose up -d
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
