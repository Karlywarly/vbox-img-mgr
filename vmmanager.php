<!doctype html>
<html class="no-js" lang="">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <title>VM Manager</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <link rel="apple-touch-icon" href="apple-touch-icon.png">
        <!-- Place favicon.ico in the root directory -->

        <link rel="stylesheet" href="css/normalize.css">
        <link rel="stylesheet" href="css/main.css">
        <script src="js/vendor/modernizr-2.8.3.min.js"></script>
    </head>
    <body>
        <!--[if lt IE 8]>
            <p class="browserupgrade">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
        <![endif]-->

        <!-- Add your site or application content here -->
        <h1>Virtual Manager Manager</h1>
        <p>If you need more functionality then <button onClick="startPHPvb()">Start PHPVirtualBox</button></p>
            <?php
            define('CREDENTIALS', "credentials");
            define('IPADDR', "/VirtualBox/GuestInfo/Net/0/V4/IP");
            define('IPALT',"ip-addr");
            define('NOTSET', "n/a");

            function statusVisibility($status, $buttonType) {
                static $myData = array(
                    'poweroff' => array('start' => 'block', 'pause' => 'none', 'resume' => 'none'),
                    'running' => array('start' => 'none', 'pause' => 'block', 'resume' => 'none'),
                    'paused' => array('start' => 'none', 'pause' => 'none', 'resume' => 'block'),
                );
                return $myData[$status][$buttonType];
            }

            $hostinfo = array('user' => 'user');
foreach (file('http://localhost/~karl/cgi-bin/vbox.cgi?list%20hostinfo') as $line) {
    $items = preg_split('/: +/', trim($line));
    if (count($items) == 2) {
        list($key, $value ) = preg_split('/: +/', trim($line));
        $hostinfo[$key] = $value;
    }
}
foreach (file('http://localhost/~karl/cgi-bin/vbox.cgi?getextradata%20global%20enumerate') as $line) {
    list(, $key,, $value ) = preg_split('/[:,] +/', trim($line));
            $hostinfo[$key] = $value;
}
$hostDescription = $hostinfo['Operating system'] . ' ' . $hostinfo['Operating system version'] .
        ' ' . $hostinfo['Processor count'] . ' cpus at ' . $hostinfo['Processor#0 speed'] . ' ' .
        $hostinfo['Memory available'] . ' of ' . $hostinfo['Memory size'] . ' available';
$hostUser = $hostinfo['user'];
$hostIP = filter_input(INPUT_SERVER, 'SERVER_ADDR');
// Get list of VM names
$vmNames = array();
foreach (file('http://localhost/~karl/cgi-bin/vbox.cgi?list%20vms') as $line) {
    preg_match('/"(.*)"/', trim($line), $matches);
            $vmNames[] = $matches[1];
}
?>
        <table class="tg">
            <tr>
                <th class="vm-th">Description</th>
                <th class="vm-th">Web Address</th>
                <th class="vm-th">Credentials</th>
                <th class="vm-th">SSH Access</th>
                <th class="vm-th">SFTP Access</th>
                <th class="vm-th">VNC Access</th>
                <th class="vm-th">Status</th>
            </tr>
            <tr>
                <td class="vm-name" rowspan="2">Host</td>
                <td class="vm-desc" colspan="6"><?php echo $hostDescription; ?></td>
            </tr>
            <tr class="host">
                <td class="vm-cell vm-web"><?php echo '<a href="http://' . $hostIP . '">http://' . $hostIP . '</a>'; ?></td>
                <td class="vm-cell vm-cred"><?php echo $hostUser; ?></td>
                <td class="vm-cell vm-ssh"><?php echo '<a href="ssh://' . $hostUser . '@' . $hostIP . '">ssh://' . $hostUser . '@' . $hostIP . '</a>'; ?></td>
                <td class="vm-cell vm-ftp"><?php echo '<a href="ftp://' . $hostUser . '@' . $hostIP . '">ftp://' . $hostUser . '@' . $hostIP . '</a>'; ?></td>
                <td class="vm-cell vm-vnc"><?php echo '<a href="vnc://' . $hostIP . '">vnc://' . $hostIP . '</a>'; ?></td>
                <td class="vm-cell vm-state running">running</td>
            </tr>  
            <?php $debug = ''; ?>
            <?php foreach ($vmNames as $name): ?>
                <?php
                $vmInfo = array();
                foreach (file('http://localhost/~karl/cgi-bin/vbox.cgi?showvminfo%20' . $name . '%20--machinereadable') as $line) {
                    list($key, $value) = explode('=', trim($line));
                    if ($value[0] == '"') {
                        preg_match('/"(.*)"/', $value, $matches);
                        $value = $matches[1];
                    }
                    $vmInfo[$key] = $value;
                }
                $description = $vmInfo['ostype'];
                if (key_exists('description', $vmInfo)) {
                    $description = $vmInfo['description'];
                }
                $state = 'unknown';
                if (key_exists('VMState', $vmInfo)) {
                    $state = $vmInfo['VMState'];
                }
                $properties = array();
                foreach (file('http://localhost/~karl/cgi-bin/vbox.cgi?guestproperty%20enumerate%20' . $name) as $line) {
                    list(, $key,, $value,,,, ) = preg_split('/[:,] +/', trim($line)); // don't care about timestamp and flag
                    $properties[$key] = $value;
                }
                foreach (file('http://localhost/~karl/cgi-bin/vbox.cgi?getextradata%20' . $name . '%20enumerate') as $line) {
                    list(, $key,, $value ) = preg_split('/[:,] +/', trim($line));
                    $properties[$key] = $value;
                }
                $ip_addr = NOTSET;
                $weblink = NOTSET;
                $sshlink = NOTSET;
                $ftplink = NOTSET;
                $credentials = NOTSET;
                $vnc = 'vnc://' . $hostIP . ':' . $vmInfo['vrdeports'];
                $vnclink = '<a href="' . $vnc . '">' . $vnc . '</a>';
                if (key_exists(IPADDR, $properties)) {
                    $ip_addr = $properties[IPADDR];
                } elseif (key_exists(IPALT, $properties)) {
                    $ip_addr = $properties[IPALT];
                }
                if ($ip_addr != NOTSET) {
                    $weblink = '<a href="http://' . $ip_addr . '">http://' . $ip_addr . '</a>';
                    if (key_exists(CREDENTIALS, $properties)) {
                        $credentials = $properties[CREDENTIALS];
                        list($user, $password) = explode('/', $credentials);
                        $ssh = 'ssh://' . $user . '@' . $ip_addr;
                        $sshlink = '<a href="' . $ssh . '">' . $ssh . '</a>';
                        $ftp = 'ftp://' . $user . '@' . $ip_addr;
                        $ftplink = '<a href="' . $ftp . '">' . $ftp . '</a>';
                    }
                }
                ?>
                <tr>
                    <td class="vm-name" rowspan="3"><?php echo $name; ?></td>
                        <td class="vm-desc" colspan="6"><?php echo $description; ?></td>
                    </tr>
                    <tr class="<?php echo $name; ?>">
                        <td class="vm-cell vm-web"><?php echo $weblink; ?></td>
                        <td class="vm-cell vm-cred"><?php echo $credentials; ?></td>
                        <td class="vm-cell vm-ssh"><?php echo $sshlink; ?></td>
                        <td class="vm-cell vm-ftp"><?php echo $ftplink; ?></td>
                        <td class="vm-cell vm-vnc"><?php echo $vnclink; ?></td>
                        <td class="vm-cell vm-state <?php echo $state; ?>"><?php echo $state; ?></td>
                    </tr>
                    <tr>
                        <td class="vm-cell vm-button vm-none "><input type="text" class="ip-<?php echo $name ?>" size="20"></button></td>
                        <td class="vm-cell vm-button vm-none "><input type="text" class="cred-<?php echo $name ?>" size="30"></button></td>
                        <td class="vm-cell vm-button vm-none "><button class="<?php echo $name ?>" onClick="editProps('<?php echo $name ?>');">Update</button></td>
                        <td class="vm-cell vm-button vm-none "></td>
                        <td class="vm-cell vm-button vm-stop "><button class="<?php echo $name ?>"  style="float: right" onClick="control('stop', '<?php echo $name ?>');">Stop</button></td>
                        <td class="vm-cell vm-button vm-start">
                            <button style="display:<?php echo statusVisibility($state, 'start');  ?>;" class="start-<?php echo $name ?>" onClick="control('start', '<?php echo $name ?>');">Start</button>
                            <button style="display:<?php echo statusVisibility($state, 'resume'); ?>;" class="resume-<?php echo $name ?>" onClick="control('resume', '<?php echo $name ?>');">Resume</button>
                            <button style="display:<?php echo statusVisibility($state, 'pause');  ?>;" class="pause-<?php echo $name ?>" onClick="control('pause', '<?php echo $name ?>');">Pause</button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
        </table>
        <p>Or, enter any vboxmanage arguments here: <input type="text" size="40" id="arbitrary"/>&nbsp;<button onClick="arbitrary()">Run!</button>
        <div id="results">
            <h2>Command Output</h2>
            <pre><?php echo $debug; ?></pre>
        </div>


        <script src="https://code.jquery.com/jquery-1.12.0.min.js"></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.12.0.min.js"><\/script>');</script>
        <script src="js/plugins.js"></script>
        <script src="js/main.js"></script>

    </body>
</html>
