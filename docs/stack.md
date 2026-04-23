- mysql with pymysql no mysqlclient
- react app, modern look, tailwind css, shadcn ui
- responsive, informative graphics, with animations, light weight
- django rest api, jwt,
- deploy.sh for deployment of the project
  combined deployment, ui will be duild locally and commited and django have template

  ## .env fiel refrence

  # ~/deploy_config/inventory/inventory.env

  ## cPanel Config File Template

  ```bash
  # ~/deploy_config/inventory/inventory.config
  GIT_DIR=~/repositories/website
  APP_DIR=~/inventory
  VIRTUALENV_PATH=/home/user/virtualenv/inventory/3.11/
  ACTIVATE_ENV=/home/user/virtualenv/inventory/3.11/bin/activate
  DB_BACKUP_PATH=~/backups/inventory/
  STATIC_ROOT=~/public_html/static/
  REQUIREMENTS_FILE=requirements/production.txt
  DOMAIN_DOC_ROOT=~/inventoryinfotech.com
  ```

- export csv, excel and pdfs
- see conds
