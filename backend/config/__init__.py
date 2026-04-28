# Patch MySQL driver before Django boots so any Django/DB import path
# resolves PyMySQL transparently in place of mysqlclient.
import pymysql  # noqa: E402

pymysql.install_as_MySQLdb()
