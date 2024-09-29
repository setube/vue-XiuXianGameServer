<?php

namespace app\controller;

use think\Request;
use app\utils\Response;
class Api
{
    protected Request $request;
    public function index()
    {
        return Response::json(0, '欢迎来到修仙游戏存档API');
    }
}