const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;
const globToRegExp = require('glob-to-regexp');

module.exports = function(source) {
  const ast = parser.parse(source, {
    sourceType: 'module',
  });
  let modifyFlag = false;
  traverse(ast, {
    MetaProperty(path) {
      if (path.node.meta.name === 'import') {
        modifyFlag = true;
        let editPath = path.parentPath;
        if (editPath.type === 'MemberExpression') {
          const porpertyName = editPath.node.property.name;
          if (porpertyName === 'globEager') {
            editPath = editPath.parentPath;
            // ---
            const parentNode = editPath.parentPath.node;
            if (parentNode.type === 'VariableDeclarator') {
              const globSplit = editPath.node.arguments[0].value.split('/');
              const fileNameRegrexString = globToRegExp(globSplit.pop()).source.replace('^', '');
              let useSubdirectories = globSplit[globSplit.length - 1] === '*';
              if (useSubdirectories) globSplit.pop();
              const identifierName = parentNode.id.name;
              parentNode.init = t.objectExpression([]);
              editPath.parentPath.parentPath.insertAfter(
                t.expressionStatement(
                  t.callExpression(
                    t.arrowFunctionExpression(
                      [t.identifier('r')],
                      t.callExpression(
                        t.memberExpression(
                          t.callExpression(t.memberExpression(t.identifier('r'), t.identifier('keys')), []),
                          t.identifier('forEach')
                        ),
                        [
                          t.arrowFunctionExpression(
                            [t.identifier('key')],
                            t.assignmentExpression(
                              '=',
                              t.memberExpression(t.identifier(identifierName), t.identifier('key'), true),
                              t.callExpression(t.identifier('r'), [t.identifier('key')])
                            )
                          )
                        ]
                      )
                    ),
                    [
                      t.callExpression(
                        t.memberExpression(t.identifier('require'), t.identifier('context')),
                        [
                          t.stringLiteral(globSplit.join('/')),
                          t.booleanLiteral(useSubdirectories),
                          t.regExpLiteral(fileNameRegrexString)
                        ]
                      )
                    ]
                  )
                )
              );
              return;
            }
          } else
          if (porpertyName === 'env' && editPath.parentPath.node.property.name === 'DEV') {
            editPath.parentPath.replaceWith(
              t.binaryExpression(
                '===',
                t.memberExpression(
                  t.memberExpression(t.identifier('process'), t.identifier('env')),
                  t.identifier('NODE_ENV')
                ),
                t.stringLiteral('development')
              )
            );
            return;
          }
        } else
        if (editPath.type === 'UnaryExpression' && editPath.node.operator === '!') {
          editPath = path;
        }
        editPath.replaceWith(t.booleanLiteral(false));
      }
    }
  });
  // if (modifyFlag) {
  //   const generated = generate(ast, {}, source);
  //   console.log('-------------');
  //   console.log(__filename + '：start');
  //   console.log(generated.code);
  //   console.log(__filename + '：end');
  //   console.log('-------------');
  // }
  return modifyFlag ? generate(ast, {}, source).code : source;
};
