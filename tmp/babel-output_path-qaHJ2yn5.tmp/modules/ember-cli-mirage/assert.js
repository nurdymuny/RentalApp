

export default assert;

export { MirageError };
var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];
function assert(bool, text) {
  if (typeof bool === 'string' && !text) {
    throw new MirageError(bool);
  }

  if (!bool) {
    throw new MirageError(text || 'Assertion failed');
  }
}

/**
  @public
  Copied from ember-metal/error
*/

function MirageError() {
  var tmp = Error.apply(this, arguments);

  for (var idx = 0; idx < errorProps.length; idx++) {
    var prop = errorProps[idx];

    if (['description', 'message', 'stack'].indexOf(prop) > -1) {
      this[prop] = 'Mirage: ' + tmp[prop];
    } else {
      this[prop] = tmp[prop];
    }
  }

  console.error(this.message);
  console.error(this);
}

MirageError.prototype = Object.create(Error.prototype);