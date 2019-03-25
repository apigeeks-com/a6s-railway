# a6s-railway

K8s deployment Orchestration tool.

## Dependencies

- Node.js - LTS version
- Kubectl
- Helm
- Valid credentials in `~/.kube/config` file.
- Other CLI tools you need to use in your deployment scripts.

## Installation

npm i -g a6s-railway

## Usage

Run `rw` in your terminal to get the help.

## Deployment Descriptor File

Each deployment should be described via deployment descriptor file. There is only one entry point presented in file called "station".

Format:

```yaml

# Deployment version
version: 1.0.0
# Base station to start the deployment from
station: 
 name: 'station.name' 
```

### Station

```yaml
# Every station should have a name of handler that processes the deployment
name: 'a6s.station'

# Each station also might require some options.
# There are 2 ways on how options can be passed:
# 1) Inline:
options:
  a: true
  # here comes the template magic of deployment descriptors
  # you can reference environment variables inside options:
  b: <%- env.TEST %>
  # or context variables produced by resolvers (read below)
  c: <%- context.test %>
  # alternativelly use `$link:<path>` syntax
  d: '$link:context.test'
# 2) Via external YAML file. External files are also handled as templates.
options_file: 'external.options.yml'

# Templates are resolved at the time deployment runs into station.
# The main limitation of template variables is that they can not contain any async processing.
# And resolvers are here to help with that. They are invoked before handler execution. Resolvers place their results into
# sharable context. Context is globally accessible, so make sure place unique name to avoid race conditions.
resolvers:
  test: 
    name: 'a6s.handler'
    # just like station handler may have its own options and be processed as a template
    options:
    options_file: 'external.handler.options.yml'
```

Each station in your deployment descriptor identified single action.
Each station is described by name of the handler and options.

## Flow control

Due to a nature of deployments they can become really complex and look more like a tree where some branches can be executed in parallel
to optimize the deployment execution time.

Special handlers exist to help with deployment processing.

### Sequential Execution

This is a most commonly used flow control handler. It allows to run multiple actions (stations) one by one.

```yaml
name: 'a6s.sequence'
  options:
    - name: 'a6s.handler.1'
      options: 
    - name: 'a6s.handler.2'
      options:    
``` 

In the example above `a6s.handler.2` will only be executed after `a6s.handler.1`.

### Parallel Execution

Sometimes it makes zero sense to wait before one handler finishes to start another one. 
E.g. You need to make installation of 5 services that have no dependencies among each other.

To help with that parallel handler exists:

```yaml
name: 'a6s.parallel'
options:
 - name: 'a6s.handler.1'
   options: 
 - name: 'a6s.handler.2'
   options:    
``` 

In the example above `a6s.handler.2` will be executed in parallel with `a6s.handler.1`.

### Complex Execution Example

```yaml
name: 'a6s.sequence'
options:
 - name: 'a6s.parallel'
   options:
    - name: 'a6s.handler.1'
      options: 
    - name: 'a6s.handler.2'
      options:  
 
 - name: 'a6s.handler.3'
   options:    
``` 

In this example `a6s.handler.1` and `a6s.handler.2` will be executed in parallel and `a6s.handler.3` will only be started
when `a6s.parallel` is completed. So 3rd handler will wait for first 2 to be completed.

### External Descriptors

When working on production grade deployment number of services that needs to be deployed will grow dramatically and managing
all of them inside single deployment descriptor file will become a pain.

Split it! Created isolated deployment descriptors for submodules/services you need to deal with.

```yaml
name: 'a6s.external'
options:
  # provide a relative or absolute path to the descriptor
  file: 'elasticsearch.station.yml'
```

### "If" Control

Run over station only when condition occurs.

```yaml
name: 'a6s.if'
options:
  # test value
  value: 'test'
  # against  
  equals: 'test2'
  # and run station if passes
  station:
    name: 'a6s.some.station' 
```

In the example above `test` will not match `test2` and station `a6s.some.station` will not be triggered.

### "Switch" Control

Run over station that matches value.

```yaml
name: 'a6s.switch'
options:
  # test value
  value: 'test'
  # against keys  
  equals:     
    test:
      name: 'a6s.some.station1' 
    test2:
      name: 'a6s.some.station2'      
```

In the example above `a6s.some.station1` will be triggered.

