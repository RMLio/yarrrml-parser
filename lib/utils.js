/**
 * This method converts the equal function to a an IDLab equal function.
 * @param fn The function that needs to be converted.
 */
function convertEqualToIDLabEqual(fn) {
  fn.function = 'http://example.com/idlab/function/equal';

  fn.parameters.forEach(pm => {
    if (pm.parameter === 'str1') {
      pm.parameter = 'http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter';
    } else if (pm.parameter === 'str2') {
      pm.parameter = 'http://users.ugent.be/~bjdmeest/function/grel.ttl#valueParameter2';
    }
  });
}

module.exports = {
    convertEqualToIDLabEqual
}
