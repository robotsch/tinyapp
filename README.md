# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

The app has a simple login and registration page
!["Screenshot of login page"](https://github.com/robotsch/tinyapp/blob/main/docs/login.PNG?raw=true)

Once logged in, the user is directed to their URL directory
!["Screenshot of URL listing"](https://github.com/robotsch/tinyapp/blob/main/docs/url_list.PNG?raw=true)

From the 'Create New URL' link, users can create a new shortened URL
!["Screenshot of URL creation page"](https://github.com/robotsch/tinyapp/blob/main/docs/url_creation.PNG?raw=true)

Users can also edit or view the analytics of any of their existing shortened URLs
!["Screenshot of URL Edit page"](https://github.com/robotsch/tinyapp/blob/main/docs/url_edit.PNG?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override


## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Features

- Create, edit, delete and share shortened URLs
- User authentication with password encryption
- Per-user saved URLs
- Basic URL analytics (creation date, click count)

## Known Issues

- Restarting the server mid-session fails to clear the assigned user session cookie, which may lead to certain pages failing to load. This can be fixed by manually deleting any leftover session cookies.