interface String {
    format(...replacements: string[]): string;
    toUnderscore(): string;
}

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, (match, number) => {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

if (!String.prototype.toUnderscore) {
    String.prototype.toUnderscore = function () {
        return this.replace(/([A-Z])/g, function ($1) {
            return "_" + $1.toLowerCase();
        });
    };
}

interface Object {
    toUnderscore(): Object;
}

if(!Object.prototype.toUnderscore) {
    Object.prototype.toUnderscore = function () {
        var obj = {};
        for(var property in this) {
            if(this.hasOwnProperty(property)) {
                obj[property.toUnderscore()] =  this[property];
            }
        }
        return obj;
    }
}