/* ==========================================================================
   Portfolio · Iván Jaureguiberry
   demo-inventario.js — Versión de prueba del inventario de la verdulería
   --------------------------------------------------------------------------
   Es una adaptación a JavaScript de PFI.py (Proyecto-Python-Tienda) para que
   se pueda probar desde el navegador. Respeta los mismos menús, mensajes y
   validaciones. Los datos viven en memoria: al recargar la página o tocar
   "Reiniciar" vuelven los productos de ejemplo de inventario.db.

   1. Terminal (salida e input)
   2. Base de datos en memoria
   3. Utilidades que imitan a Python
   4. Funciones del programa (igual que en PFI.py)
   5. Programa principal
   ========================================================================== */

'use strict';

const InventarioDemo = (() => {
  /* ------------------------------------------------------------------------
     1. Terminal (salida e input)
     ------------------------------------------------------------------------ */

  let salida = null;
  let entrada = null;
  let resolverInput = null;
  let ejecucion = 0; // Cambia en cada reinicio para cortar la ejecución anterior

  class ProgramaReiniciado extends Error {}

  /** Agrega una línea a la terminal. `color` es una clase CSS (t-green, t-red…). */
  function print(texto = '', color = '') {
    String(texto)
      .split('\n')
      .forEach((linea) => {
        const span = document.createElement('span');
        span.className = `t-line ${color}`.trim();
        span.textContent = linea;
        salida.appendChild(span);
      });
    salida.scrollTop = salida.scrollHeight;
  }

  /** Equivalente a input() de Python: muestra el texto y espera Enter. */
  function input(texto = '') {
    const miEjecucion = ejecucion;
    const lineas = String(texto).split('\n');
    const ultima = lineas.pop();
    lineas.forEach((linea) => print(linea));

    const prompt = document.createElement('span');
    prompt.className = 't-line';
    prompt.textContent = ultima;
    salida.appendChild(prompt);
    salida.scrollTop = salida.scrollHeight;

    entrada.disabled = false;
    entrada.focus();

    return new Promise((resolve, reject) => {
      resolverInput = (valor) => {
        if (miEjecucion !== ejecucion) {
          reject(new ProgramaReiniciado());
          return;
        }
        const escrito = document.createElement('span');
        escrito.className = 't-input';
        escrito.textContent = valor;
        prompt.appendChild(escrito);
        resolve(valor);
      };
    });
  }

  /* ------------------------------------------------------------------------
     2. Base de datos en memoria
     Mismos productos que trae inventario.db en el repositorio.
     ------------------------------------------------------------------------ */

  let productos = [];
  let proximoId = 1;

  function cargarDatosIniciales() {
    productos = [
      { id: 1, nombre: 'Manteca', descripcion: '', cantidad: 50, precio: 51, categoria: '' },
      { id: 2, nombre: 'Mantecol', descripcion: '', cantidad: 45, precio: 15, categoria: '' },
    ];
    proximoId = 3;
  }

  const buscarPorId = (id) => productos.find((p) => p.id === id) || null;

  /* ------------------------------------------------------------------------
     3. Utilidades que imitan a Python
     ------------------------------------------------------------------------ */

  /** int() de Python: acepta solo enteros, si no lanza ValueError. */
  function int(texto) {
    if (!/^\s*[+-]?\d+\s*$/.test(texto)) throw new ValueError();
    return parseInt(texto, 10);
  }

  /** float() de Python. */
  function float(texto) {
    if (!/^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?\s*$/.test(texto)) throw new ValueError();
    return parseFloat(texto);
  }

  class ValueError extends Error {}

  /** str.capitalize() de Python: primera letra en mayúscula y el resto en minúscula. */
  const capitalize = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

  /** Cómo imprime Python un float (51.0, 15.5…). */
  const formatoFloat = (n) => (Number.isInteger(n) ? `${n}.0` : String(n));

  /** Relleno a la izquierda como {valor:<n} en un f-string. */
  const ljust = (valor, ancho) => String(valor).padEnd(ancho, ' ');

  const mensajeExito = (m) => print(m, 't-green');
  const mensajeError = (m) => print(m, 't-red');
  const mensajeAdvertencia = (m) => print(m, 't-yellow');
  const mensajeSeleccion = (m) => print(m, 't-green-dim');

  const pausa = () => input('\nPresione una tecla para continuar...');

  /* ------------------------------------------------------------------------
     4. Funciones del programa (igual que en PFI.py)
     ------------------------------------------------------------------------ */

  async function mensajeValidacion(resultado, nombre) {
    if (resultado) {
      mensajeExito(`El producto ${nombre} fue actualizado con exito!`);
    } else {
      mensajeError(`El producto ${nombre} no fue actualizado!`);
    }
    await pausa();
  }

  async function validarPrecio(nombre) {
    while (true) {
      try {
        const precio = float(await input(`Ingrese el precio del producto ${nombre}: `));
        if (precio > 0) return precio;
        mensajeError(`Error: El precio del producto no puede ser ${formatoFloat(precio)}`);
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  async function validarCantidad(nombre) {
    while (true) {
      try {
        const cantidad = int(await input(`Ingrese la cantidad del producto ${nombre}: `));
        if (cantidad > 0) return cantidad;
        mensajeError(`Error: La cantidad del producto no puede ser ${cantidad}`);
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  async function seguir(opcion) {
    let seg = capitalize((await input(`\n¿Desea ${opcion} otro producto? Si/No: `)).trim());
    while (seg !== 'Si' && seg !== 'No') {
      mensajeError(`Error: ${seg} no es una opcion valida!`);
      seg = capitalize((await input(`¿Desea ${opcion} otro producto? Si/No: `)).trim());
    }
    return seg;
  }

  async function mostrarMenu() {
    print("\n******* VERDULERIA 'PYNTHO' *******\n", 't-cyan');
    print('1. Registrar nuevos productos');
    print('2. Actualizar los productos');
    print('3. Eliminar un producto');
    print('4. Mostrar los productos');
    print('5. Buscar producto');
    print('6. Generar reporte de bajo stock');
    print('7. Compra de producto');
    print('8. Salir del programa\n');

    return int(await input('Ingrese una opcion: '));
  }

  async function registrarProducto() {
    while (true) {
      const nombre = capitalize((await input('Ingrese el nuevo producto: ')).trim());
      const existe = productos.some((p) => p.nombre === nombre);

      if (!existe) {
        const descripcion = await input(`Ingrese la descripcion del producto ${nombre}: `);
        const cantidad = await validarCantidad(nombre);
        const precio = await validarPrecio(nombre);
        const categoria = capitalize(await input(`Ingrese la categoria del producto ${nombre}: `));

        productos.push({ id: proximoId++, nombre, descripcion, cantidad, precio, categoria });
        mensajeExito(`El producto ${nombre} fue agregado exitosamente!`);

        if ((await seguir('agregar')) === 'No') break;
      } else {
        mensajeAdvertencia(`El producto ${nombre} ya esta registrado.`);
        await pausa();
        break;
      }
    }
  }

  async function actualizarProducto() {
    let salir = false;

    while (true) {
      try {
        const id = int(await input('Ingrese el ID del producto que quiera modificar: '));
        const producto = buscarPorId(id);

        if (!producto) {
          mensajeAdvertencia(`El producto de id '${id}' no se encuentra en la base de datos.`);
          await pausa();
          break;
        }

        let nombre = producto.nombre;

        while (true) {
          print('\n¿Que tipo de actualizacion desea hacer?\n', 't-blue');
          print('1. Actualizar nombre');
          print('2. Actualizar descripcion');
          print('3. Actualizar cantidad');
          print('4. Actualizar precio');
          print('5. Actualizar categoria');
          print('6. Actualizar todo');
          print('7. Actualizar otro producto');
          print('8. Volver al menu principal\n');

          try {
            const opcion = int(await input('Ingrese una opcion: '));

            if (opcion === 1) {
              nombre = capitalize((await input('Ingrese el nuevo nombre del producto: ')).trim());
              producto.nombre = nombre;
              await mensajeValidacion(true, nombre);
            } else if (opcion === 2) {
              producto.descripcion = await input(`Ingrese la descripcion del producto ${nombre}: `);
              await mensajeValidacion(true, nombre);
            } else if (opcion === 3) {
              producto.cantidad = await validarCantidad(nombre);
              await mensajeValidacion(true, nombre);
            } else if (opcion === 4) {
              producto.precio = await validarPrecio(nombre);
              await mensajeValidacion(true, nombre);
            } else if (opcion === 5) {
              producto.categoria = capitalize(
                await input(`Ingrese la nueva categoria del producto ${nombre}: `),
              );
              await mensajeValidacion(true, nombre);
            } else if (opcion === 6) {
              const nuevoNombre = capitalize((await input('Ingrese el nuevo nombre del producto: ')).trim());
              const descripcion = await input(`Ingrese la descripcion del producto ${nuevoNombre}: `);
              const cantidad = await validarCantidad(nuevoNombre);
              const precio = await validarPrecio(nuevoNombre);
              const categoria = await input(`Ingrese la nueva categoria del producto ${nuevoNombre}: `);
              Object.assign(producto, { nombre: nuevoNombre, descripcion, cantidad, precio, categoria });
              nombre = nuevoNombre;
              await mensajeValidacion(true, nuevoNombre);
            } else if (opcion === 7) {
              break;
            } else if (opcion === 8) {
              print('\nVolviendo al menu principal...', 't-red-dim');
              salir = true;
              break;
            } else {
              mensajeError(`Error: La opcion ${opcion} es incorrecta.`);
              await pausa();
            }
          } catch (error) {
            if (!(error instanceof ValueError)) throw error;
            mensajeError('Error: Ingreso un valor no numerico');
          }
        }
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }

      if (salir) break;
    }
  }

  async function eliminarProducto() {
    while (true) {
      try {
        const id = int(await input('Ingrese el ID del producto que desea eliminar: '));
        const producto = buscarPorId(id);

        if (!producto) {
          mensajeAdvertencia(`El producto de id '${id}' no se encuentra en la base de datos.`);
          await pausa();
          break;
        }

        const nombre = producto.nombre;
        const pregunta = `¿Esta seguro de que desea eliminar el producto ${nombre}? Si/No: `;
        let confirmacion = capitalize((await input(pregunta)).trim());

        while (confirmacion !== 'Si' && confirmacion !== 'No') {
          mensajeError(`Error: ${confirmacion} no es una opcion valida. Ingresela nuevamente.`);
          confirmacion = capitalize((await input(pregunta)).trim());
        }

        if (confirmacion === 'Si') {
          productos = productos.filter((p) => p.id !== id);
          mensajeExito(`El producto ${nombre} ha sido eliminado con exito`);
          if ((await seguir('eliminar')) === 'No') break;
        } else {
          mensajeAdvertencia(`El producto ${nombre} no ha sido eliminado`);
          break;
        }
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  function filaProducto(p) {
    return (
      `${ljust(p.id, 5)} ${ljust(p.nombre, 20)} ${ljust(p.descripcion || 'N/A', 40)} ` +
      `${ljust(p.cantidad, 10)} $${ljust(formatoFloat(p.precio), 10)} ${ljust(p.categoria || 'N/A', 15)}`
    );
  }

  const ENCABEZADO =
    `${ljust('ID', 5)} ${ljust('Nombre', 20)} ${ljust('Descripcion', 40)} ` +
    `${ljust('Cantidad', 10)} ${ljust('Precio', 10)} ${ljust('Categoria', 15)}`;

  function mostrarProductos() {
    if (productos.length === 0) {
      mensajeAdvertencia('\nNo hay productos registrados en el inventario.');
      return;
    }
    print('\nProductos registrados:', 't-blue');
    print(`\n${ENCABEZADO}`);
    print(` ${'-'.repeat(105)}`);
    productos.forEach((p) => print(filaProducto(p)));
  }

  function mostrarEspecifico(lista) {
    mensajeExito('\nSe han encontrado productos!');
    print(`\n${ENCABEZADO}`);
    print(` ${'-'.repeat(100)}`);
    lista.forEach((p) => print(filaProducto(p)));
  }

  async function buscarPorIdMenu() {
    try {
      const id = int(await input('Ingrese el ID del producto que desea buscar: '));
      const producto = buscarPorId(id);
      if (!producto) mensajeAdvertencia(`\nEl ID ${id} no corresponde a ningun producto.`);
      else mostrarEspecifico([producto]);
    } catch (error) {
      if (!(error instanceof ValueError)) throw error;
      mensajeError('Error: Ingreso un valor no numerico');
    }
  }

  async function buscarPorNombre() {
    const nombre = capitalize((await input('Ingrese el nombre del producto que desea buscar: ')).trim());
    const producto = productos.find((p) => p.nombre === nombre);
    if (!producto) mensajeAdvertencia(`\nEl producto ${nombre} no se encuentra en la base de datos.`);
    else mostrarEspecifico([producto]);
  }

  async function buscarPorCategoria() {
    const categoria = capitalize((await input('Ingrese la categoria que desea buscar: ')).trim());
    const lista = productos.filter((p) => p.categoria === categoria);
    if (lista.length === 0) mensajeAdvertencia(`\nNo hay productos registrados en la categoria ${categoria}.`);
    else mostrarEspecifico(lista);
  }

  async function buscarProductos() {
    while (true) {
      try {
        print('\nBuscar producto por:', 't-blue');
        print('1. ID');
        print('2. Nombre');
        print('3. Categoria');
        print('4. Salir\n');
        const eleccion = int(await input('Ingrese la opcion: '));

        if (eleccion === 1) await buscarPorIdMenu();
        else if (eleccion === 2) await buscarPorNombre();
        else if (eleccion === 3) await buscarPorCategoria();
        else if (eleccion === 4) {
          print('Volviendo al menu...', 't-red-dim');
          break;
        } else mensajeError(`Error: ${eleccion} no es una opcion valida`);

        await pausa();
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  async function reporteBajoStock() {
    while (true) {
      try {
        const limite = int(await input('Ingrese el limite para el control de stock minimo: '));
        const lista = productos.filter((p) => p.cantidad <= limite);

        if (lista.length === 0) {
          mensajeAdvertencia(`No hay productos con stock inferior o igual a ${limite}`);
        } else {
          const encabezado = `${ljust('Nombre', 30)} |${ljust('Cantidad', 10)}`;
          print('\nListado de productos con bajo stock\n', 't-blue');
          print(encabezado);
          print('-'.repeat(encabezado.length));
          lista.forEach((p) => print(`${ljust(p.nombre, 30)} |${ljust(p.cantidad, 10)}`));
        }
        await pausa();
        break;
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  async function ventaProducto() {
    while (true) {
      try {
        const id = int(await input('Ingrese el id del producto que sera vendido: '));
        const producto = buscarPorId(id);

        if (!producto) {
          mensajeError(`Error: El producto con ID ${id} no existe en la base de datos!`);
          await pausa();
          break;
        }

        const { nombre, cantidad: stock } = producto;

        if (stock <= 0) {
          mensajeAdvertencia(`No hay stock disponible para el producto ${nombre}`);
          await pausa();
          break;
        }

        const cantidad = await validarCantidad(nombre);

        if (cantidad > 0 && cantidad <= stock) {
          producto.cantidad = stock - cantidad;
          mensajeExito(`Venta exitosa! Ahora quedan ${producto.cantidad} unidades de ${nombre}`);
          if ((await seguir('comprar')) === 'No') break;
        } else {
          mensajeAdvertencia(`Stock insuficiente. Actualmente hay ${stock} unidades de ${nombre}`);
          await pausa();
          break;
        }
      } catch (error) {
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  /* ------------------------------------------------------------------------
     5. Programa principal
     ------------------------------------------------------------------------ */

  async function programaPrincipal() {
    while (true) {
      try {
        const opcion = await mostrarMenu();

        if (opcion === 1) {
          mensajeSeleccion('\nUsted a seleccionado registrar nuevos productos.');
          await registrarProducto();
        } else if (opcion === 2) {
          mensajeSeleccion('\nUsted a seleccionado actualizar los producto.');
          await actualizarProducto();
        } else if (opcion === 3) {
          mensajeSeleccion('\nUsted a seleccionado eliminar un producto.');
          await eliminarProducto();
        } else if (opcion === 4) {
          mensajeSeleccion('\nUsted a seleccionado mostrar los productos.');
          mostrarProductos();
          await pausa();
        } else if (opcion === 5) {
          mensajeSeleccion('\nUsted a seleccionado buscar producto.');
          await buscarProductos();
        } else if (opcion === 6) {
          mensajeSeleccion('\nUsted a seleccionado generar reporte de bajo stock.');
          await reporteBajoStock();
        } else if (opcion === 7) {
          mensajeSeleccion('\nUsted a seleccionado compra de un producto.');
          await ventaProducto();
        } else if (opcion === 8) {
          print('\nSaliendo del programa...', 't-red-dim');
          print('\n(Tocá "Reiniciar" para volver a empezar)', 't-muted');
          entrada.disabled = true;
          break;
        } else {
          mensajeError(`Error: La opcion ${opcion} es incorrecta.`);
          await pausa();
        }
      } catch (error) {
        if (error instanceof ProgramaReiniciado) return;
        if (!(error instanceof ValueError)) throw error;
        mensajeError('Error: Ingreso un valor no numerico');
      }
    }
  }

  /** Conecta la terminal con el HTML. Se llama una sola vez. */
  function iniciar({ salida: elSalida, form, entrada: elEntrada }) {
    salida = elSalida;
    entrada = elEntrada;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!resolverInput || entrada.disabled) return;
      const valor = entrada.value;
      const resolver = resolverInput;
      resolverInput = null;
      entrada.value = '';
      resolver(valor);
    });
  }

  /** Borra la terminal, recarga los datos de ejemplo y arranca de nuevo. */
  function reiniciar() {
    ejecucion += 1;
    if (resolverInput) {
      const anterior = resolverInput;
      resolverInput = null;
      anterior('');
    }
    salida.textContent = '';
    cargarDatosIniciales();
    programaPrincipal().catch((error) => {
      if (!(error instanceof ProgramaReiniciado)) console.error(error);
    });
  }

  return { iniciar, reiniciar };
})();
