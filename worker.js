// 在代码开始的地方配置域名
const domain = 'example.com';

// 监听 fetch 事件
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 处理请求的函数
async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  if (pathname === '/') {
    return handleRootRequest();
  } else if (pathname === '/upload' && request.method === 'POST') {
    return handleUploadRequest(request);
  } else {
    // 构建新的请求 URL
    const url = new URL(request.url);
    url.hostname = 'telegra.ph';

    // 发起原始请求并返回响应
    return fetch(url, request);
  }
}

// 处理根路径请求的函数
function handleRootRequest() {
  const html = 
  `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover">
    <meta name="description" content="基于Cloudflare Workers的图床服务">
    <meta name="keywords" content="Workers图床, Cloudflare, Workers, JIASU.IN, 图床">
    <title>JIASU.IN-基于Workers的图床服务</title>
    <link rel="icon" href="https://p1.meituan.net/csc/c195ee91001e783f39f41ffffbbcbd484286.ico" type="image/x-icon">
    <!-- Twitter Bootstrap CSS -->
    <link href="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/twitter-bootstrap/4.6.1/css/bootstrap.min.css" type="text/css" rel="stylesheet" />
    <!-- Bootstrap FileInput CSS -->
    <link href="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-fileinput/5.2.7/css/fileinput.min.css" type="text/css" rel="stylesheet" />
    <!-- Toastr CSS -->
    <link href="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/toastr.js/2.1.4/toastr.min.css" type="text/css" rel="stylesheet" />
    <!-- jQuery -->
    <script src="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.min.js" type="application/javascript"></script>
    <!-- Bootstrap FileInput JS -->
    <script src="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-fileinput/5.2.7/js/fileinput.min.js" type="application/javascript"></script>
    <!-- Bootstrap FileInput Chinese Locale JS -->
    <script src="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-fileinput/5.2.7/js/locales/zh.min.js" type="application/javascript"></script>
    <!-- Toastr JS -->
    <script src="https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/toastr.js/2.1.4/toastr.min.js" type="application/javascript"></script> 
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Long+Cang&display=swap');
    
    .title {
      font-family: "Long Cang", cursive;
      font-weight: 400;
      font-style: normal;
      font-size: 2em; /* 调整字体大小 */
      text-align: center;
      margin-top: 20px; /* 调整距离顶部的距离 */
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); /* 添加阴影效果 */
    }
    </style>
    </head> 
    <body>
    <div class="card">
    <div class="title">JIASU.IN</div>
    <div class="card-body">
        <!-- 表单 -->
        <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
            <!-- 接口选择下拉菜单 -->
            <div class="form-group mb-3">
                <select class="custom-select" id="interfaceSelector" name="interface">
                <option value="tg">tg</option>
                </select>
            </div>
            <!-- 文件选择 -->
            <div class="form-group mb-3">
            <input id="fileInput" name="file" type="file" class="form-control-file" data-browse-on-zone-click="true">
            </div>            
            <!-- 添加按钮组 -->
            <div class="form-group mb-3" style="display: none;"> <!-- 初始隐藏 -->
                <button type="button" class="btn btn-light mr-2" id="urlBtn">URL</button>
                <button type="button" class="btn btn-light mr-2" id="bbcodeBtn">BBCode</button>
                <button type="button" class="btn btn-light" id="markdownBtn">Markdown</button>
            </div>
            <!-- 文件链接文本框 -->
            <div class="form-group mb-3" style="display: none;"> <!-- 初始隐藏 -->
                <textarea class="form-control" id="fileLink" readonly></textarea>
            </div>
            <!-- 上传中的提示 -->
            <div id="uploadingText" style="display: none; text-align: center;">文件上传中...</div>          
        </form>
    </div>
    <p style="font-size: 14px; text-align: center;">
    项目开源于 GitHub - <a href="https://github.com/0-RTT/telegraph" target="_blank" rel="noopener noreferrer">0-RTT/telegraph</a>
    </p>   
</div>

<script>
  $(document).ready(function () {
    let originalImageURL = '';

    // 初始化文件上传
    initFileInput();

    // 文件上传初始化函数
    function initFileInput() {
      $("#fileInput").fileinput({
        theme: 'fa',
        language: 'zh',
        dropZoneEnabled: true,
        browseOnZoneClick: true,
        dropZoneTitle: "拖拽文件到这里...",
        dropZoneClickTitle: "",
        browseClass: "btn btn-light",
        uploadClass: "btn btn-light",
        removeClass: "btn btn-light",
        showUpload: false,
        layoutTemplates: {
          actionZoom: '',
        },
      }).on('filebatchselected', handleFileSelection)
        .on('fileclear', handleFileClear); // 添加移除按钮点击事件处理程序
    }

    // 处理文件选择事件
    async function handleFileSelection() {
      const selectedInterface = $('#interfaceSelector').val();
      const file = $('#fileInput')[0].files[0];

      if ((selectedInterface === 'tg') && file && file.type === 'image/gif' && file.size > 5 * 1024 * 1024) {
        toastr.error('GIF 文件必须≤5MB');
        return;
      }

      // 对于 GIF 文件，直接返回原始文件，不进行压缩处理
      if (file.type === 'image/gif') {
        originalImageURL = URL.createObjectURL(file);
        $('#fileLink').val(originalImageURL);
        $('.form-group').show();
        adjustTextareaHeight($('#fileLink')[0]);
        return;
      }

      // 判断是否需要压缩
      const compressedFile = await compressImage(file);

      // 文件选择后提交表单
      try {
        $('#uploadingText').show();
        const formData = new FormData($('#uploadForm')[0]);
        formData.set('file', compressedFile, compressedFile.name); // 替换原始文件为压缩后的文件
        const uploadResponse = await fetch('/upload', { method: 'POST', body: formData });
        originalImageURL = await handleUploadResponse(uploadResponse);
        $('#fileLink').val(originalImageURL);
        $('.form-group').show();

        // 上传完成后调整文本框高度
        adjustTextareaHeight($('#fileLink')[0]);
      } catch (error) {
        console.error('上传文件时出现错误:', error);
        $('#fileLink').val('文件上传失败！');
      } finally {
        $('#uploadingText').hide();
      }
    }

    // 处理上传响应
    async function handleUploadResponse(response) {
      if (response.ok) {
        const result = await response.json();
        return result.data;
      } else {
        return '文件上传失败！';
      }
    }

    // 处理移除按钮点击事件
    function handleFileClear(event) {
      // 清空文本框的内容
      $('#fileLink').val('');

      // 上传完成后调整文本框高度
      adjustTextareaHeight($('#fileLink')[0]);

      // 隐藏按钮和文本框
      hideButtonsAndTextarea();
    }

    // 根据接口选择器的值设置文件类型接受属性
    $('#interfaceSelector').change(function () {
      const selectedInterface = $(this).val();
      let acceptTypes = '';
    
      switch (selectedInterface) {
        case 'tg':
          acceptTypes = 'image/gif,image/jpeg,image/png';
          break;
      }
      $('#fileInput').attr('accept', acceptTypes);
    }).trigger('change');

    // 处理按钮点击事件
    $('#urlBtn, #bbcodeBtn, #markdownBtn').on('click', function () {
      const fileLink = originalImageURL.trim();
      if (fileLink !== '') {
        let formattedLink;
        switch ($(this).attr('id')) {
          case 'urlBtn':
            formattedLink = fileLink;
            break
            case 'urlBtn':
              formattedLink = fileLink;
              break;
            case 'bbcodeBtn':
              formattedLink = '[img]' + fileLink + '[/img]';
              break;
            case 'markdownBtn':
              formattedLink = '![image](' + fileLink + ')';
              break;
            default:
              formattedLink = fileLink;
          }
          $('#fileLink').val(formattedLink);
          adjustTextareaHeight($('#fileLink')[0]); // 调整文本框高度
          copyToClipboardWithToastr(formattedLink);
        }
      });
  
      // 自动调整文本框高度函数
      function adjustTextareaHeight(textarea) {
        textarea.style.height = '1px'; // 先将高度设置为最小值
        textarea.style.height = (textarea.scrollHeight) + 'px'; // 根据内容重新设置高度
      }
  
      // 复制文本到剪贴板，并显示 toastr 提示框
      function copyToClipboardWithToastr(text) {
        const input = document.createElement('input');
        input.setAttribute('value', text);
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
  
        toastr.success('已复制到剪贴板', '', { timeOut: 300 });
      }
  
      // 隐藏按钮和文本框
      function hideButtonsAndTextarea() {
        $('#urlBtn, #bbcodeBtn, #markdownBtn, #fileLink').parent('.form-group').hide();
      }
  
      // 图片压缩函数
      function compressImage(file) {
        return new Promise((resolve) => {
          const quality = 0.6; // 设置压缩质量，你也可以根据需要修改
          const reader = new FileReader(); // 创建 FileReader
          reader.onload = ({ target: { result: src } }) => {
            const image = new Image(); // 创建 img 元素
            image.onload = async () => {
              const canvas = document.createElement('canvas'); // 创建 canvas 元素
              canvas.width = image.width; // 设置 canvas 宽度为图片宽度
              canvas.height = image.height; // 设置 canvas 高度为图片高度
              const ctx = canvas.getContext('2d'); // 获取 2D 上下文
              ctx.drawImage(image, 0, 0, image.width, image.height); // 在 canvas 上绘制图片
  
              // 将图片压缩为 JPEG 格式
              const compressedDataURL = canvas.toDataURL('image/jpeg', quality);
  
              // 将 base64 编码的图片数据转换为 Blob 对象
              const blob = await fetch(compressedDataURL).then(res => res.blob());
  
              // 创建压缩后的 File 对象
              const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
  
              resolve(compressedFile);
            };
            image.src = src; // 设置图片对象的 src 属性为文件的 base64 编码
          };
          reader.readAsDataURL(file); // 读取文件并将其作为 base64 编码传递给 onload 函数
        });
      }
    });
  </script>
  
</body>
</html>
  `;

// 返回 HTML 内容，并设置响应头为 UTF-8 编码
return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

// 接口配置对象，包含各平台的上传配置
const interfaceConfigs = {
  tg: {
    uploadURL: 'https://telegra.ph/upload',
    // 准备表单数据的函数
    prepareFormData: async function(file, formData) {
        // 在这里设置上传请求头部信息
        const uploadHeaders = {
          // 在这里添加需要的请求头部信息，如果没有则留空
        };

        return {
          url: this.uploadURL, // 使用对象属性的上传 URL
          headers: uploadHeaders,
          body: formData
        };
    }
}
};
// 处理上传请求的函数
async function handleUploadRequest(request) {
  try {
    // 从请求中提取表单数据
    const formData = await request.formData();
    const selectedInterface = formData.get('interface');
    const file = formData.get('file');

    // 检查是否存在接口和文件
    if (!selectedInterface || !file) {
      throw new Error('Missing interface or file');
    }

    // 获取接口配置
    const config = interfaceConfigs[selectedInterface];
    if (!config) {
      throw new Error('Interface configuration not found');
    }

    // 准备上传表单数据
    const preparedFormData = await config.prepareFormData(file, formData);
    // 发送上传请求
    const response = await fetch(preparedFormData.url, {
      method: 'POST',
      headers: preparedFormData.headers,
      body: preparedFormData.body
    });

    // 检查响应状态
    if (!response.ok) {
      throw new Error('Upload Failed');
    }

    // 根据接口获取响应数据
    const responseData = await response.json();
    // 获取图片链接
    const imageURL = getImageURL(selectedInterface, responseData);

    // 返回图片链接作为响应
    const jsonResponse = { data: imageURL };
    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// 获取图片链接的函数
function getImageURL(selectedInterface, responseData) {
  let url;

  // 根据不同接口解析图片链接
  switch (selectedInterface) {
    case 'tg':
       url = `https://${domain}${responseData[0].src}`;
      break;
    default:
      throw new Error('Unexpected response format');
  }
  
  return url;
} 