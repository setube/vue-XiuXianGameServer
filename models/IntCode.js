class IntCode {
    constructor(length = 9, key = 2543.5415412812) {
        this.strbase = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        this.key = key;
        this.length = length;
        this.codelen = this.strbase.substring(0, this.length);
        this.codenums = this.strbase.substring(this.length, this.length + 10);
        this.codeext = this.strbase.substring(this.length + 10);
    }
    encode(nums) {
        let rtn = '';
        const numslen = nums.toString().length;
        // 密文第一位标记数字的长度
        const begin = this.codelen[numslen - 1];
        // 密文的扩展位长度
        const extlen = this.length - numslen - 1;
        // 计算扩展位内容
        let temp = (nums / this.key).toString().replace('.', '');
        temp = temp.substring(temp.length - extlen);
        // 扩展位替换
        const arrextTemp = this.codeext.split('');
        const arrext = temp.split('');
        for (let v of arrext) {
            if (isNaN(v)) return nums;
            rtn += arrextTemp[v];
        }
        // 数字替换
        const arrnumsTemp = this.codenums.split('');
        const arrnums = nums.toString().split('');
        for (let v of arrnums) {
            if (this.strbase.indexOf(v) === -1) return nums;
            rtn += arrnumsTemp[v];
        }
        return begin + rtn;
    }
    decode(code) {
        // 取得密文第一位
        const begin = code[0];
        let rtn = '';
        if (begin) {
            const len = this.codelen.indexOf(begin);
            if (len !== -1) {
                const actualLen = len + 1;
                const arrnums = code.substring(code.length - actualLen).split('');

                for (let v of arrnums) {
                    rtn += this.codenums.indexOf(v);
                }
            }
        }
        return rtn;
    }
}

export { IntCode };