# Install LVCE

Choose a download that matches your operating system and processor. These docs target **LVCE 0.127.6**. The [release page](https://github.com/lvce-editor/lvce-editor/releases/tag/v0.127.6) lists every asset for that version.

## Windows

1. Download **Lvce-Setup-v0.127.6-x64.exe** for an Intel/AMD computer, or **Lvce-Setup-v0.127.6-arm64.exe** for Windows on ARM.
2. Open the installer and follow its prompts.
3. Launch LVCE from the Start menu.

## macOS

1. Download **lvce-v0.127.6_arm64.dmg** for Apple silicon.
2. Open the disk image and drag LVCE into Applications.
3. Launch it from Applications.

This release does not provide an Intel macOS disk image. Check the release assets before choosing a different version.

## Linux: Debian or Ubuntu

Download **lvce-v0.127.6_amd64.deb** for an Intel/AMD computer or **lvce-v0.127.6_arm64.deb** for ARM64. Open a terminal in the download directory and install the matching file:

```sh
sudo apt install ./lvce-v0.127.6_amd64.deb
```

For ARM64, substitute the ARM64 filename. Launch LVCE from the application menu, or run `lvce` in a terminal.

## Linux: AppImage

Download **Lvce-v0.127.6_amd64.AppImage**. Make it executable and run it:

```sh
chmod +x Lvce-v0.127.6_amd64.AppImage
./Lvce-v0.127.6_amd64.AppImage
```

The published AppImage is for Intel/AMD Linux. If your distribution reports a missing FUSE dependency, install its AppImage/FUSE runtime support or use the Debian package on a compatible distribution.

## Check your installation

Open LVCE. You should see the editor window. Continue with [your first project](./first-project).

To update later, install a newer release for the same platform. Consult [version information](../about/versions) before comparing a live browser example with your desktop installation.
