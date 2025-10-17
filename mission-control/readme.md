****************************************
Welcome to Mission Control by Gravity 🚀
****************************************

Mission Control enables you to administer your Gravity SaaS application
from one centralised dashboard. Here you can: manage accounts and users, 
view metrics, track events, collect feedback and view error logs.

# Requirements

Before you can use Mission Control you should set up your main Gravity
application. Mission Control will plug into your existing API endpoints
and database.

## 1. Install Packages

First, ensure your main application is set up and running, then run
the following command in your terminal.

npm run setup

## 2. Setup Wizard

After you have completed the setup process, open a new browser
window and navigate to:

http://localhost:5002/setup 

Then follow the instructions in the setup wizard to complete the
setup process. When you're finished please remove all references
to the setup files in yoru code base.

### 3. Cleanup

You MUST remove the setup files from your install after setup. 
Failing to do so, will let anyone access the setup process.

npm run cleanup

For more information please read the documentation:
https://docs.usegravity.app

If you have any problems, contact support: support@usegravity.app
