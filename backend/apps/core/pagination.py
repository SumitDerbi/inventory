"""Standard pagination — 20 default, max 100, with envelope `{count,next,previous,results}`."""
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
