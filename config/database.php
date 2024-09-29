<?php

return [
    // 默认使用的数据库连接配置
    'default' => env('DB_DRIVER', 'mysql'),

    // 自定义时间查询规则
    'time_query_rule' => [],

    // 自动写入时间戳字段
    // true为自动识别类型 false关闭
    // 字符串则明确指定时间字段类型 支持 int timestamp datetime date
    'auto_timestamp' => true,

    // 时间字段取出后的默认时间格式
    'datetime_format' => 'Y-m-d H:i:s',

    // 时间字段配置 配置格式：create_time,update_time
    'datetime_field' => '',

    // 数据库连接配置信息
    'connections' => [
        'sqlite' => [
            'type' => 'sql ite',
            'dsn' => 'sqlite:./xiuxian.db',
            'prefix' => 'xiuxian_',
        ],

        // 更多的数据库配置信息
    ],
];
