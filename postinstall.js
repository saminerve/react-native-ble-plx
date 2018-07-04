const platformParams = ['--platform', 'iOS']

const childProcess = require('child_process')

console.warn('===VISEO=== react-native-ble-plx')


var parentModulePackageJson = null
try {
  parentModulePackageJson = require('../../package.json')
} catch (e) {
  console.warn('You should run react-native-ble-plx from root of your project')
}

if (process.platform === 'darwin' && shouldUseCarthage()) {
  var carthageVersionProcessResult = childProcess.spawnSync('carthage', ['version'], {
    stdio: 'pipe'
  })

  if (carthageVersionProcessResult.status != 0) {
    // `carthage` not found (probably)
    errorExitProcess(
      'carthage is required to compile frameworks for iOS backend. You can install it with brew: "brew install carthage". After installation go to ./node_modules/react-native-ble-plx and run "./postinstall.js" or reinstall node module'
    )
  }

  const bleClientManagerDirectory = __dirname + '/ios/BleClientManager'
  try {
    process.chdir(bleClientManagerDirectory)
  } catch (err) {
    errorExitProcess(`${bleClientManagerDirectory} directory not found. Cannot proceed with building the library.`)
  }

  spawnSyncProcessAndExitOnError('carthage', ['bootstrap', ...platformParams])

  const carthageVersionString = carthageVersionProcessResult.output[1].toString()
  spawnSyncProcessAndExitOnError('carthage', getCarthageBuildParams(carthageVersionString))

  process.exit(0)
}

function shouldUseCarthage() {
  const reactNativeBlePlxOptions = parentModulePackageJson && parentModulePackageJson['react-native-ble-plx']
  if (!reactNativeBlePlxOptions) return true
  const useCarthage = reactNativeBlePlxOptions.carthage
  return useCarthage != undefined ? useCarthage : true
}

function errorExitProcess(errorMessage) {
  console.error(`Error: ${errorMessage}`)
  process.exit(1)
}

function spawnSyncProcessAndExitOnError(command, params) {
  const result = childProcess.spawnSync(command, params, {
    stdio: 'inherit'
  })

  if (result.status != 0) {
    errorExitProcess(`"${command} ${params.join(' ')}"  command failed with status=${result.status}`)
  }
}

function getCarthageBuildParams(carthageVersionString) {
  // check version of `carthage` to alter build params
  const majorMinorPatch = carthageVersionString.split('.')
  const major = parseInt(majorMinorPatch[0])
  const minor = parseInt(majorMinorPatch[1])
  const buildParams = ['build', '--no-skip-current', ...platformParams]
  if (major > 0 || minor > 20) {
    // --cache-builds should be available (unless version 1.x.x will remove it)
    buildParams.push('--cache-builds')
  }
  return buildParams
}
