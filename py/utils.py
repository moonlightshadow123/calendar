import sys, traceback, os

def addPath(path):
    cwd = os.getcwd()
    thepath = os.path.join(cwd, path)
    print("Add to Path: {}".format(thepath))
    sys.path.append(thepath)

def getFilePath(file):
    dir_path = os.path.dirname(os.path.realpath(file))
    print(dir_path)
    print(file)
    return dir_path

def getTraceLog(err):
    exc_type, exc_value, exc_traceback = sys.exc_info()
    traces = traceback.format_exception(exc_type, exc_value, exc_traceback)
    traceLogs = ""
    for trace in traces:
        traceLogs += trace
    print(traceLogs)
    return traceLogs

def get_decorator(errors=(Exception, ), default_value=''):

    def decorator(func):

        def new_func(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as err:
                print("Oops, something went wront...Here's the detail:\n{}".format(getTraceLog(err)))
                # return default_value
        return new_func

    return decorator

try_deco = get_decorator((KeyError, NameError), default_value='default')

if __name__ == "__main__":
    a = {}

    @f
    def example1(a):
        return a['b']

    @f
    def example2(a):
        return doesnt_exist()

    print(example1(a))
    print(example2(a))
