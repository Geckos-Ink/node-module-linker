
if(!String.prototype.replaceAll){
    String.prototype.replaceAll = function(from, to){
        return this.split(from).join(to);
    }
}